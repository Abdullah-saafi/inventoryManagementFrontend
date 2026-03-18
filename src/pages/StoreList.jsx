import { useState } from "react";
import API from "../services/api";

const toggleStore = (id) => API.patch(`/stores/${id}/toggle`);

const STORE_TYPE_LABELS = {
  HEAD_OFFICE: "Head Office",
  MAIN_STORE: "Main Store",
  SUB_STORE: "Sub Store",
};

export default function StoreList({ stores, setStores, loadStores, showToast }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [togglingStore, setTogglingStore] = useState(null);
  

  const handleToggle = async (s) => {
    setTogglingStore(s.store_id);
    try {
      const res = await toggleStore(s.store_id);
      showToast(res.data.message);
      setStores((prev) =>
        prev.map((x) => (x.store_id === s.store_id ? { ...x, is_active: !x.is_active } : x))
      );
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update store", "error");
    } finally {
      setTogglingStore(null);
    }
  };

  const displayedStores = (stores || []).filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
        s.store_name?.toLowerCase().includes(q) || 
        s.store_code?.toLowerCase().includes(q);
    const matchType = !typeFilter || s.store_type === typeFilter;
    return matchSearch && matchType;
});

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-56"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="HEAD_OFFICE">Head Office</option>
          <option value="MAIN_STORE">Main Store</option>
          <option value="SUB_STORE">Sub Store</option>
        </select>
        <button onClick={loadStores} className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto">↻ Refresh</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Store Code", "Store Name", "Type", "Status", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedStores.map((s) => (
              <tr key={s.store_id} className={`border-b border-gray-100 hover:bg-gray-50 ${!s.is_active ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-mono text-emerald-600 text-xs font-bold">{s.store_code}</td>
                <td className="px-4 py-3 text-gray-800 font-semibold">{s.store_name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded border font-mono bg-gray-50">
                    {STORE_TYPE_LABELS[s.store_type] || s.store_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold">
                    <span className={s.is_active ? "text-emerald-600" : "text-red-500"}>{s.is_active ? "Active" : "Inactive"}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(s)}
                    disabled={togglingStore === s.store_id}
                    className={`text-xs font-semibold px-3 py-1 rounded border ${s.is_active ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
                  >
                    {togglingStore === s.store_id ? "..." : s.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}