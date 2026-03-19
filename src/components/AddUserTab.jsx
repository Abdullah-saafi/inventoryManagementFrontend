import { useState } from "react";
import API from "../services/api";
import { EyeOpen, EyeClosed } from "./EyeIcons";
import { ROLES, ROLE_STORE_MAP, inputClass, labelClass } from "../services/constants";
import useErrorHandler from "./useErrorHandler";

const addUser = (data) => API.post("/users/addUser", data);

export default function AddUserTab({ stores, onUserCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    store_id: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const handleError = useErrorHandler()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "role" ? { store_id: "" } : {}),
    }));
    // Clear message when user starts typing again
    setMessage("")
  };

  const filteredStores = stores.filter(
    (s) => s.store_type === ROLE_STORE_MAP[form.role] && s.is_active
  );

  const handleSubmit = async () => {
    const { name, email, role, store_id, password, confirmPassword } = form;
    
    if (!name || !email || !role || !store_id || !password || !confirmPassword)
      return setMessage("Please fill all required fields");
    if (password !== confirmPassword)
      return setMessage("Passwords do not match");
    if (password.length < 6)
      return setMessage("Password must be at least 6 characters");

    setLoading(true);
    setMessage("");

    try {
      const res = await addUser(form);
      setMessage(res.data.message);
      setForm({ name: "", email: "", role: "", store_id: "", password: "", confirmPassword: "" });
      onUserCreated?.();
    } catch (e) {
      const msg = handleError(e,"Failed to add user")
      setMessage(msg)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        {/* Form Fields... (Keep your existing grid layouts) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Role *</label>
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
              <option value="">Select Role</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Store / Branch *</label>
            <select
              name="store_id"
              value={form.store_id}
              onChange={handleChange}
              disabled={!form.role}
              className={inputClass + (!form.role ? " opacity-50 cursor-not-allowed" : "")}
            >
              <option value="">{form.role ? "Select Store" : "Select role first"}</option>
              {filteredStores.map((s) => (
                <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Name and Email Rows */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Ahmed Khan" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email Address *</label>
            <input type="email" name="email" autoComplete="new-password" value={form.email} onChange={handleChange} placeholder="ahmed@company.com" className={inputClass} />
          </div>
        </div>

        {/* Password Rows */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label className={labelClass}>Password *</label>
            <input type={showPass ? "text" : "password"} name="password" autoComplete="new-password" value={form.password} onChange={handleChange} className={inputClass + " pr-10"} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute bottom-2.5 right-3 text-gray-400 hover:text-emerald-500">{showPass ? <EyeOpen /> : <EyeClosed />}</button>
          </div>
          <div className="relative">
            <label className={labelClass}>Confirm Password *</label>
            <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className={inputClass + " pr-10"} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute bottom-2.5 right-3 text-gray-400 hover:text-emerald-500">{showConfirm ? <EyeOpen /> : <EyeClosed />}</button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create User Account"}
          </button>

          {/* STATUS MESSAGE BOX */}
          {message && (
            <div className={`p-3 rounded-lg text-xs font-bold border animate-in fade-in slide-in-from-top-1 duration-300 text-center
              ${message.includes("Successfully")
                ? "bg-emerald-100 border-emerald-200 text-emerald-700" 
                : "bg-red-50 border-red-100 text-red-700"}`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}