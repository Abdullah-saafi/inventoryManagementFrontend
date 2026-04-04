import { useEffect, useState } from "react";
import { STORE_TYPE_LABELS } from "../services/constants";
import useErrorHandler from "./useErrorHandler";
import { getStores, storeStatus } from "../services/api";
import { useNavigate, useOutletContext } from "react-router-dom";

export default function AllStoresTab() {

  const { loadStores: refreshAdminStores } = useOutletContext(); 

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stores, setStores] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleError = useErrorHandler();
  const navigate = useNavigate()

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await getStores({ all: true });
      setStores(response.data.data || []);
    } catch (error) {
      const msg = handleError(error, "Failed to load stores");
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleAction = async (id, currentStatus) => {
    try {
      setLoading(true);
      const status = !currentStatus;
      const response = await storeStatus(id, {status} );
      
      if (response.status === 200) {
        await loadStores();
        if (refreshAdminStores) refreshAdminStores();
        setMessage(`Success: Store ${status ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      const msg = handleError(error, "Failed to update store status");
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayed = stores.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.store_name.toLowerCase().includes(q) ||
      s.store_code.toLowerCase().includes(q);
    const matchType = !typeFilter || s.store_type === typeFilter;
    return matchSearch && matchType;
  });

  const hasFilters = search || typeFilter;
  const isSuccess = message.toLowerCase().includes("success");

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56 shadow-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        >
          <option value="">All Types</option>
          <option value="HEAD_OFFICE">Head Office</option>
          <option value="MAIN_STORE">Main Store</option>
          <option value="SUB_STORE">Sub Store</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setTypeFilter(""); }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear
          </button>
        )}
        <button
          onClick={loadStores}
          className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg border flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300
          ${isSuccess
            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
            : "bg-red-50 border-red-100 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{isSuccess ? "✅" : "⚠️"}</span>
            <p className="text-[10px] font-black uppercase tracking-tight">{message}</p>
          </div>
          <button onClick={() => setMessage("")} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Store Code", "Store Name", "Type", "Address", "Phone", "Status", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-bold text-[10px] uppercase tracking-wider font-sans">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">No stores found.</td>
              </tr>
            ) : (
              displayed.map((s) => (
                <tr key={s.store_id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!s.is_active ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3"><span className="font-mono text-emerald-600 text-[11px] font-bold">{s.store_code}</span></td>
                  <td className="px-4 py-3 text-gray-800 font-semibold">{s.store_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase
                        ${s.store_type === "HEAD_OFFICE" ? "bg-purple-50 border-purple-200 text-purple-600"
                        : s.store_type === "MAIN_STORE" ? "bg-blue-50 border-blue-200 text-blue-600"
                          : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                      {STORE_TYPE_LABELS[s.store_type] || s.store_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-[11px]">{s.address || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-[11px]">{s.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase ${s.is_active ? "text-emerald-600" : "text-red-500"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleAction(s.store_id, s.is_active)}
                      disabled={loading}
                      className={`text-[10px] uppercase mr-2 font-black px-3 py-1 rounded border transition-colors disabled:opacity-40
                        ${s.is_active ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"}`}
                    >
                      {s.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button className="text-[10px] uppercase font-bold text-gray-600 border border-gray-300 bg-gray-200 rounded px-3 py-1 hover:bg-gray-300" onClick={() => {navigate(`/admin/store/${s.store_id}`)}}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-gray-400 text-[10px] uppercase font-bold px-1">
        {displayed.length} store{displayed.length !== 1 ? "s" : ""} shown
      </div>
    </div>
  );
}
