import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  fulfillRequest,
  getItems,
  getStores,
} from "../services/api";

const BADGE = {
  PENDING: "bg-amber-500/20   text-amber-400   border-amber-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/20     text-red-400     border-red-500/30",
  FULFILLED: "bg-blue-500/20    text-blue-400    border-blue-500/30",
};
const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${BADGE[status] || "border-slate-600 text-slate-400"}`}
  >
    {status}
  </span>
);

export default function HeadOffice() {
  const [tab, setTab] = useState("requests");

  // Requests tab
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("APPROVED");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);

  // Inventory tab
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [filterStore, setFilterStore] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load HO requests (MAIN_TO_HO direction, APPROVED status means manager approved)
  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = { direction: "MAIN_TO_HO" };
      if (filter) params.status = filter;
      const r = await getRequests(params);
      setRequests(r.data.data);
    } catch {
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load inventory
  const loadItems = async () => {
    setItemsLoading(true);
    try {
      const params = {};
      if (filterStore) params.store_id = filterStore;
      if (filterCategory) params.category = filterCategory;
      const [iRes, sRes] = await Promise.all([getItems(params), getStores()]);
      setItems(iRes.data.data);
      setStores(sRes.data.data);
    } catch {
      showToast("Failed to load inventory", "error");
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);
  useEffect(() => {
    if (tab === "inventory") loadItems();
  }, [tab, filterStore, filterCategory]);

  const openDetail = async (r) => {
    setDL(true);
    setDetail({ ...r, items: [] });
    try {
      const res = await getRequestById(r.request_id);
      setDetail(res.data.data);
    } catch {
    } finally {
      setDL(false);
    }
  };

  // Head Office fulfills APPROVED MAIN_TO_HO requests
  const handleFulfill = async (requestId) => {
    setFulfilling(requestId);
    try {
      await fulfillRequest(requestId);
      showToast("Request fulfilled — Main Store inventory updated");
      setDetail(null);
      loadRequests();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fulfill", "error");
    } finally {
      setFulfilling(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "APPROVED").length;

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const displayed = items.filter(
    (i) =>
      !search ||
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.item_no.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-white">Head Office</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Fulfill approved Main Store requests and view all inventory
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-5">
        {[
          { id: "requests", label: "Fulfill Requests", count: pendingCount },
          { id: "inventory", label: "View Inventory" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors
              ${tab === t.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="bg-emerald-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Fulfill Requests ─────────────────────────────────────── */}
      {tab === "requests" && (
        <div>
          {pendingCount > 0 && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
              <span className="text-emerald-400 text-sm font-semibold">
                {pendingCount} request{pendingCount > 1 ? "s" : ""} approved by
                Main Store Manager — waiting for you to fulfill
              </span>
            </div>
          )}

          <div className="mb-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">
                Pending (awaiting manager approval)
              </option>
              <option value="APPROVED">Approved — Ready to Fulfill</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    {[
                      "Request No",
                      "Requested By",
                      "Approved By",
                      "Date",
                      "Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-slate-500"
                      >
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr
                        key={r.request_id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-emerald-400 text-xs font-bold">
                            {r.request_no}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {r.requested_by_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {r.approved_by_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openDetail(r)}
                              className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1"
                            >
                              Details
                            </button>
                            {r.status === "APPROVED" && (
                              <button
                                onClick={() => handleFulfill(r.request_id)}
                                disabled={fulfilling === r.request_id}
                                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 disabled:opacity-40"
                              >
                                {fulfilling === r.request_id
                                  ? "..."
                                  : "Fulfill"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Inventory ─────────────────────────────────────────────── */}
      {tab === "inventory" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item name or number..."
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm w-56 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
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
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
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

          {itemsLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    {[
                      "Item No",
                      "Name",
                      "Category",
                      "UOM",
                      "Quantity",
                      "Min Qty",
                      "Store",
                      "Stock",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-12 text-slate-500"
                      >
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    displayed.map((i) => {
                      const isLow =
                        parseFloat(i.item_quantity) <=
                        parseFloat(i.min_quantity);
                      return (
                        <tr
                          key={i.item_id}
                          className="border-b border-slate-800 hover:bg-slate-800/50"
                        >
                          <td className="px-4 py-3 font-mono text-emerald-400 text-xs">
                            {i.item_no}
                          </td>
                          <td className="px-4 py-3 text-white font-semibold">
                            {i.item_name}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {i.category || "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">
                            {i.item_uom}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">
                            {i.item_quantity}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400 text-xs">
                            {i.min_quantity}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {i.store_name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold ${isLow ? "text-red-400" : "text-emerald-400"}`}
                            >
                              {isLow ? "Low" : "OK"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDetail(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Request — {detail.request_no}
              </h2>
              <button
                onClick={() => setDetail(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {detailLoad ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Status", <StatusBadge status={detail.status} />],
                      ["Requested By", detail.requested_by_name || "—"],
                      ["Approved By", detail.approved_by_name || "—"],
                      [
                        "Date",
                        new Date(detail.created_at).toLocaleDateString(),
                      ],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-slate-800 rounded p-2">
                        <div className="text-slate-500 text-xs mb-1">
                          {label}
                        </div>
                        <div className="text-white text-sm">{val}</div>
                      </div>
                    ))}
                  </div>
                  {detail.notes && (
                    <div className="bg-slate-800 rounded p-3">
                      <div className="text-slate-500 text-xs mb-1">NOTES</div>
                      <div className="text-slate-300 text-sm">
                        {detail.notes}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
                      Items
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs">
                          <th className="text-left pb-2">Item</th>
                          <th className="text-left pb-2">UOM</th>
                          <th className="text-center pb-2">Requested</th>
                          <th className="text-center pb-2">Fulfilled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.items || []).map((i) => (
                          <tr
                            key={i.request_item_id}
                            className="border-b border-slate-800"
                          >
                            <td className="py-2 text-white">{i.item_name}</td>
                            <td className="py-2 text-slate-400 text-xs">
                              {i.item_uom}
                            </td>
                            <td className="py-2 font-mono text-white text-center">
                              {i.requested_qty}
                            </td>
                            <td className="py-2 font-mono text-center">
                              <span
                                className={
                                  i.fulfilled_qty != null
                                    ? "text-blue-400"
                                    : "text-slate-600"
                                }
                              >
                                {i.fulfilled_qty ?? "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {detail.status === "APPROVED" && (
                    <div className="pt-2 border-t border-slate-700">
                      <button
                        onClick={() => handleFulfill(detail.request_id)}
                        disabled={fulfilling === detail.request_id}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2 rounded disabled:opacity-40"
                      >
                        {fulfilling === detail.request_id
                          ? "Processing..."
                          : "Fulfill Request"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
          ${
            toast.type === "success"
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : toast.type === "error"
                ? "bg-red-500/20 border-red-500/40 text-red-300"
                : "bg-blue-500/20 border-blue-500/40 text-blue-300"
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
