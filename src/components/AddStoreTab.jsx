import { useState } from "react";
import { useOutletContext } from "react-router-dom"; // 1. Import context
import { addStore } from "../services/api";
import { inputClass, labelClass } from "../services/constants";
import useErrorHandler from "../components/useErrorHandler";

export default function AddStoreTab() {
  // 2. Get loadStores from Admin.jsx context
  const { loadStores } = useOutletContext(); 

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
      // Force SUB_STORE type as per your requirement
      const res = await addStore({ ...form, store_type: "SUB_STORE" });
      
      const createdName = res.data?.data?.store_name || "Store";
      setMessage(`Success: Sub store "${createdName}" created successfully`);
      
      // Reset form
      setForm({ store_code: "", store_name: "", address: "", phone: "" });
      
      // 3. Refresh the global stores list in Admin.jsx
      if (loadStores) await loadStores();
      
    } catch (e) {
      const msg = handleError(e, "Failed to create store");
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.toLowerCase().includes("success") || message.toLowerCase().includes("successfully");

  return (
    <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Store Code *</label>
            <input
              name="store_code"
              value={form.store_code}
              onChange={handleChange}
              autoComplete="off"
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
              autoComplete="off"
              placeholder="e.g. Sub Store Delta"
              className={inputClass}
            />
          </div>
        </div>

        {/* Address Field */}
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

        {/* Phone Field with Numeric Enforcement */}
        <div>
          <label className={labelClass}>Phone</label>
          <input
            name="phone"
            inputMode="numeric"
            maxLength={11}
            value={form.phone}
            onChange={(e) => {
              // Ensure only numbers are entered
              const val = e.target.value.replace(/\D/g, "");
              setForm(f => ({ ...f, phone: val }));
              if (message) setMessage("");
            }}
            placeholder="e.g. 03451234567"
            className={inputClass}
          />
        </div>

        {/* Informational Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-blue-600 text-[11px] font-medium leading-relaxed">
          <div className="flex gap-2">
            <span>💡</span>
            <p>
              This store will be created as a <span className="font-bold text-blue-700 underline decoration-blue-200">SUB_STORE</span>.
              After creation, switch to the <span className="font-bold text-blue-700">Add User</span> tab 
              to assign staff to this branch.
            </p>
          </div>
        </div>

        {/* Action Area */}
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

          {/* Status Feedback */}
          {message && (
            <div
              className={`p-3 rounded-lg text-[10px] uppercase font-black border text-center animate-in fade-in slide-in-from-top-1 duration-300
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