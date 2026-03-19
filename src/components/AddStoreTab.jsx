import { useState } from "react";
import { addStore } from "../services/api";
import { inputClass, labelClass } from "../services/constants";
import useErrorHandler from "../components/useErrorHandler";

export default function AddStoreTab({ onStoreCreated }) {
  const [form, setForm] = useState({
    store_code: "",
    store_name: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleError = useErrorHandler();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (message) setMessage("");
  };

  const handleSubmit = async () => {
    if (!form.store_code || !form.store_name) {
      return setMessage("Store code and store name are required");
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await addStore({ ...form, store_type: "SUB_STORE" });
      setMessage(`Sub store "${res.data.data.store_name}" created successfully`);
      setForm({ store_code: "", store_name: "", address: "", phone: "" });
      onStoreCreated?.();
    } catch (e) {
      const msg = handleError(e, "Failed to create store");
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.toLowerCase().includes("successfully");

  return (
    <div className="max-w-xl">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Store Code *</label>
            <input
              name="store_code"
              value={form.store_code}
              onChange={handleChange}
              placeholder="e.g. SUB-004"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Store Name *</label>
            <input
              name="store_name"
              value={form.store_name}
              onChange={handleChange}
              placeholder="e.g. Sub Store Delta"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="e.g. Block 5, Karachi"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input
            name="phone"
            inputMode="numeric"
            maxLength={11}
            value={form.phone}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/\D/g, "");
              handleChange(e)
            }}
            placeholder="e.g. 0345-1234567"
            className={inputClass}
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-blue-600 text-[11px] font-medium leading-relaxed">
          💡 This store will be created as a <span className="font-bold text-blue-700">SUB_STORE</span>.
          After creating it, go to the <span className="font-bold text-blue-700">Add User</span> tab
          to assign management staff to this branch.
        </div>

        <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Create Sub Store"
            )}
          </button>

          {/* MESSAGE DISPLAY AREA */}
          {message && (
            <div
              className={`p-3 rounded-lg text-xs font-bold border text-center animate-in fade-in slide-in-from-top-1 duration-300
                ${isSuccess
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
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