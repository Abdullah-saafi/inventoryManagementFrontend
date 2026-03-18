import { useState } from "react";
import API from "../services/api";

const addStore = (data) => API.post("/stores", data);

const inputClass = "w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400";
const labelClass = "text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1";

export default function AddStore({ onStoreCreated, showToast }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    store_code: "",
    store_name: "",
    address: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.store_code || !form.store_name)
      return showToast("Store code and store name are required", "error");
    
    setLoading(true);
    try {
      const res = await addStore({ ...form, store_type: "SUB_STORE" });
      showToast(`Sub store "${res.data.data.store_name}" created successfully`);
      setForm({ store_code: "", store_name: "", address: "", phone: "" });
      if (onStoreCreated) onStoreCreated();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to create store", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Store Code *</label>
            <input name="store_code" value={form.store_code} onChange={handleChange} placeholder="e.g. SUB-004" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Store Name *</label>
            <input name="store_name" value={form.store_name} onChange={handleChange} placeholder="e.g. Sub Store Delta" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <input name="address" value={form.address} onChange={handleChange} placeholder="e.g. Block 5, Karachi" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 021-1234567" className={inputClass} />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-600 text-xs">
          This store will be created as a <span className="font-bold">SUB_STORE</span>.
        </div>
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Sub Store"}
          </button>
        </div>
      </div>
    </div>
  );
}