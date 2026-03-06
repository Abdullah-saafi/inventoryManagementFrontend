import { useEffect, useState } from "react";
import { getItems, getStores } from "../services/api";

export default function HeadOffice() {
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterStore, setFilterStore] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStore) params.store_id = filterStore;
      if (filterCategory) params.category = filterCategory;

      const [iRes, sRes] = await Promise.all([getItems(params), getStores()]);
      setItems(iRes.data.data);
      setStores(sRes.data.data);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStore, filterCategory]);

  if (loading)
    return <div className="text-center py-10 text-white">Loading...</div>;

  if (error)
    return <div className="text-center py-10 text-red-400">{error}</div>;

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  const displayed = items.filter(
    (i) =>
      !search ||
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.item_no.toLowerCase().includes(search.toLowerCase()),
  );

  const totalQty = displayed.reduce(
    (sum, i) => sum + parseFloat(i.item_quantity || 0),
    0,
  );

  const lowCount = displayed.filter(
    (i) => parseFloat(i.item_quantity) <= parseFloat(i.min_quantity),
  ).length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="text-slate-400 text-xs uppercase mb-1">
            Total Items
          </div>
          <div className="text-white font-bold text-xl font-mono">
            {displayed.length}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="text-slate-400 text-xs uppercase mb-1">
            Total Quantity
          </div>
          <div className="text-white font-bold text-xl font-mono">
            {totalQty.toFixed(0)}
          </div>
        </div>

        <div
          className={`rounded-lg p-3 border ${
            lowCount > 0
              ? "bg-red-500/10 border-red-500/30"
              : "bg-slate-800/50 border-slate-700"
          }`}
        >
          <div className="text-slate-400 text-xs uppercase mb-1">Low Stock</div>
          <div
            className={`font-bold text-xl font-mono ${
              lowCount > 0 ? "text-red-400" : "text-white"
            }`}
          >
            {lowCount}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item name or number..."
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm w-56"
        />

        <select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.store_name}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {(filterStore || filterCategory || search) && (
          <button
            onClick={() => {
              setFilterStore("");
              setFilterCategory("");
              setSearch("");
            }}
            className="text-slate-400 hover:text-white text-sm px-3 py-2 border border-slate-700 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-700">
          <thead className="bg-slate-800">
            <tr className="text-left text-slate-300 text-sm">
              <th className="p-3">Item No</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">UOM</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Min Qty</th>
              <th className="p-3">Store</th>
              <th className="p-3">Stock</th>
            </tr>
          </thead>

          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-slate-500">
                  No items found.
                </td>
              </tr>
            ) : (
              displayed.map((i) => {
                const isLow =
                  parseFloat(i.item_quantity) <= parseFloat(i.min_quantity);

                return (
                  <tr key={i.item_id} className="border-t border-slate-700">
                    <td className="p-3 font-mono text-emerald-400 text-xs">
                      {i.item_no}
                    </td>

                    <td className="p-3 text-white font-semibold">
                      {i.item_name}
                    </td>

                    <td className="p-3 text-slate-400 text-xs">
                      {i.category || "—"}
                    </td>

                    <td className="p-3 font-mono text-xs text-slate-300">
                      {i.item_uom}
                    </td>

                    <td
                      className={`p-3 font-mono font-bold ${
                        isLow ? "text-red-400" : "text-white"
                      }`}
                    >
                      {i.item_quantity}
                    </td>

                    <td className="p-3 font-mono text-slate-400 text-xs">
                      {i.min_quantity}
                    </td>

                    <td className="p-3 text-slate-400 text-xs">
                      {i.store_name}
                    </td>

                    <td
                      className={`p-3 text-xs font-semibold ${
                        isLow ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {isLow ? "Low Stock" : "OK"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
