import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  fulfillRequest,
  getStores,
  getItems,
  createRequest,
  getItemSummary,
} from "../services/api";

const StatusBadge = ({ status }) => {
  const s = {
    PENDING: "bg-amber-500/20   text-amber-400   border-amber-500/30",
    APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    REJECTED: "bg-red-500/20     text-red-400     border-red-500/30",
    FULFILLED: "bg-blue-500/20    text-blue-400    border-blue-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || ""}`}
    >
      {status}
    </span>
  );
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "requests", label: "Sub Store Requests" },
  { id: "items", label: "All Items" },
  { id: "ho-status", label: "HO Requests Status" },
  { id: "ho-create", label: "New HO Request" },
];

export default function MainStore() {
  const [tab, setTab] = useState("overview");

  // ── data ──
  const [requests, setRequests] = useState([]);
  const [reqFilter, setReqFilter] = useState("APPROVED");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [mainStores, setMainStores] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [itemSummaryReceived, setItemSummaryReceived] = useState([]);
  const [itemSummaryGiven, setItemSummaryGiven] = useState([]);
  const [hoRequests, setHoRequests] = useState([]);
  const [hoFilter, setHoFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [hoForm, setHoForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ item_no: "", item_name: "", item_uom: "", requested_qty: 1 }],
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (reqFilter) params.status = reqFilter;
      const [rRes, sRes, iRes] = await Promise.all([
        getRequests(params),
        getStores(),
        getItems(),
      ]);
      setRequests(rRes.data.data);
      const allStores = sRes.data.data;
      setMainStores(allStores.filter((s) => s.store_type === "MAIN_STORE"));
      setHeadOffices(allStores.filter((s) => s.store_type === "HEAD_OFFICE"));
      setItems(iRes.data.data);

      const [recvSummary, givenSummary, hoReqRes] = await Promise.all([
        getItemSummary({ direction: "MAIN_TO_HO" }),
        getItemSummary({ direction: "SUB_TO_MAIN" }),
        getRequests({ direction: "MAIN_TO_HO" }),
      ]);
      setItemSummaryReceived(recvSummary.data.data);
      setItemSummaryGiven(givenSummary.data.data);
      setHoRequests(hoReqRes.data.data);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reqFilter]);

  useEffect(() => {
    if (hoForm.from_store_id)
      getItems({ store_id: hoForm.from_store_id })
        .then((r) => setStoreItems(r.data.data || []))
        .catch(() => setStoreItems([]));
    else setStoreItems([]);
  }, [hoForm.from_store_id]);

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

  const handleFulfill = async (requestId) => {
    setFulfilling(requestId);
    try {
      await fulfillRequest(requestId);
      showToast("Request fulfilled and inventory updated");
      setDetail(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fulfill", "error");
    } finally {
      setFulfilling(null);
    }
  };

  const addLine = () =>
    setHoForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { item_no: "", item_name: "", item_uom: "", requested_qty: 1 },
      ],
    }));
  const removeLine = (idx) =>
    setHoForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx, field, value) => {
    setHoForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "item_no") {
        const found = storeItems.find((i) => i.item_no === value);
        if (found) {
          items[idx].item_name = found.item_name;
          items[idx].item_uom = found.item_uom;
        }
      }
      return { ...f, items };
    });
  };

  const handleHoRequest = async () => {
    const { from_store_id, to_store_id, requested_by_name, items } = hoForm;
    if (
      !from_store_id ||
      !to_store_id ||
      !requested_by_name ||
      items.some(
        (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
      )
    )
      return showToast("Please fill all required fields", "error");
    setCreating(true);
    try {
      await createRequest({ ...hoForm, direction: "MAIN_TO_HO" });
      showToast("Request submitted to Head Office");
      setHoForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        items: [{ item_no: "", item_name: "", item_uom: "", requested_qty: 1 }],
      });
      setTab("ho-status");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to submit", "error");
    } finally {
      setCreating(false);
    }
  };

  // ── derived ──
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const displayedItems = items.filter((i) => {
    const matchSearch =
      !search ||
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.item_no.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || i.category === filterCategory;
    return matchSearch && matchCat;
  });
  const filteredHoRequests = hoFilter
    ? hoRequests.filter((r) => r.status === hoFilter)
    : hoRequests;
  const pendingApproved = requests.filter(
    (r) => r.status === "APPROVED",
  ).length;

  // ── item flow map ──
  const buildItemMap = () => {
    const map = {};
    itemSummaryReceived.forEach((i) => {
      if (!map[i.item_no])
        map[i.item_no] = {
          item_no: i.item_no,
          item_name: i.item_name,
          item_uom: i.item_uom,
          received: 0,
          given: 0,
        };
      map[i.item_no].received += parseFloat(i.total_fulfilled || 0);
    });
    itemSummaryGiven.forEach((i) => {
      if (!map[i.item_no])
        map[i.item_no] = {
          item_no: i.item_no,
          item_name: i.item_name,
          item_uom: i.item_uom,
          received: 0,
          given: 0,
        };
      map[i.item_no].given += parseFloat(i.total_fulfilled || 0);
    });
    const invMap = {};
    items.forEach((i) => {
      invMap[i.item_no] = parseFloat(i.item_quantity || 0);
    });
    return { rows: Object.values(map), invMap };
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
        {error}
      </div>
    );

  const { rows: itemRows, invMap } = buildItemMap();
  const totalReceived = itemRows.reduce((s, r) => s + r.received, 0);
  const totalGiven = itemRows.reduce((s, r) => s + r.given, 0);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-white">Main Store</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Manage sub store requests, track inventory flow, and request from Head
          Office
        </p>
      </div>

      {/* ── Internal Nav Bar ── */}
      <nav className="bg-slate-900 border border-slate-700 rounded-lg mb-6 px-2 py-1.5 flex items-center gap-1 flex-wrap">
        {TABS.map((t) => {
          const badge =
            t.id === "requests" && pendingApproved > 0
              ? pendingApproved
              : t.id === "ho-status" &&
                  hoRequests.filter((r) => r.status === "PENDING").length > 0
                ? hoRequests.filter((r) => r.status === "PENDING").length
                : null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${tab === t.id ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              {t.label}
              {badge && (
                <span
                  className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none
                  ${tab === t.id ? "bg-white/20 text-white" : "bg-emerald-600 text-white"}`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW                                      */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Items in Inventory",
                value: items.length,
                cls: "text-white",
              },
              {
                label: "Received from HO",
                value: totalReceived.toFixed(0),
                cls: "text-emerald-400",
              },
              {
                label: "Given to Sub Stores",
                value: totalGiven.toFixed(0),
                cls: "text-blue-400",
              },
              {
                label: "Pending to Fulfill",
                value: pendingApproved,
                cls: pendingApproved > 0 ? "text-amber-400" : "text-white",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
              >
                <div className="text-slate-400 text-xs uppercase mb-1">
                  {s.label}
                </div>
                <div className={`font-bold text-2xl font-mono ${s.cls}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Item Flow Table */}
          {itemRows.length > 0 ? (
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                  <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    Item Flow — Received vs Given vs Remaining
                  </span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-emerald-400">
                    ▲ In:{" "}
                    <span className="font-mono font-bold">
                      {totalReceived.toFixed(0)}
                    </span>
                  </span>
                  <span className="text-blue-400">
                    ▼ Out:{" "}
                    <span className="font-mono font-bold">
                      {totalGiven.toFixed(0)}
                    </span>
                  </span>
                  <span className="text-white">
                    = Stock:{" "}
                    <span className="font-mono font-bold">
                      {items
                        .reduce(
                          (s, i) => s + parseFloat(i.item_quantity || 0),
                          0,
                        )
                        .toFixed(0)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      {[
                        "Item No",
                        "Item Name",
                        "UOM",
                        "↓ Received from HO",
                        "↑ Given to Sub Stores",
                        "Current Stock",
                        "Net",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2 text-slate-400 font-semibold text-xs uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.map((row) => {
                      const stock = invMap[row.item_no] ?? null;
                      const net = row.received - row.given;
                      return (
                        <tr
                          key={row.item_no}
                          className="border-b border-slate-800 hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5 font-mono text-slate-400 text-xs">
                            {row.item_no}
                          </td>
                          <td className="px-4 py-2.5 text-white font-semibold text-xs">
                            {row.item_name}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">
                            {row.item_uom}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">
                            {row.received.toFixed(0)}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-blue-400">
                            {row.given.toFixed(0)}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold">
                            {stock !== null ? (
                              <span
                                className={
                                  stock <= 0 ? "text-red-400" : "text-white"
                                }
                              >
                                {stock.toFixed(0)}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold">
                            <span
                              className={
                                net >= 0 ? "text-emerald-400" : "text-red-400"
                              }
                            >
                              {net >= 0 ? "+" : ""}
                              {net.toFixed(0)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-800/60 border-t-2 border-slate-600">
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-slate-400 text-xs font-semibold uppercase"
                      >
                        Totals
                      </td>
                      <td className="px-4 py-2 font-mono font-bold text-emerald-300">
                        {totalReceived.toFixed(0)}
                      </td>
                      <td className="px-4 py-2 font-mono font-bold text-blue-300">
                        {totalGiven.toFixed(0)}
                      </td>
                      <td className="px-4 py-2 font-mono font-bold text-white">
                        {items
                          .reduce(
                            (s, i) => s + parseFloat(i.item_quantity || 0),
                            0,
                          )
                          .toFixed(0)}
                      </td>
                      <td className="px-4 py-2 font-mono font-bold">
                        <span
                          className={
                            totalReceived - totalGiven >= 0
                              ? "text-emerald-300"
                              : "text-red-300"
                          }
                        >
                          {totalReceived - totalGiven >= 0 ? "+" : ""}
                          {(totalReceived - totalGiven).toFixed(0)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 text-center py-12 text-slate-500 text-sm">
              No fulfilled requests yet — item flow data will appear here once
              requests are fulfilled.
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: SUB STORE REQUESTS                           */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "requests" && (
        <div>
          <div className="mb-4">
            <select
              value={reqFilter}
              onChange={(e) => setReqFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="FULFILLED">Fulfilled</option>
            </select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  {[
                    "Request No",
                    "From",
                    "To",
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
                      colSpan={8}
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
                        {r.item_count > 0 && (
                          <span className="ml-2 bg-slate-700 text-slate-400 text-xs font-mono rounded px-1.5 py-0.5 border border-slate-600">
                            {r.item_count} item{r.item_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {r.from_store_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {r.to_store_name}
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
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 disabled:opacity-40"
                            >
                              {fulfilling === r.request_id ? "..." : "Fulfill"}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: ALL ITEMS                                    */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "items" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or item number..."
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
            />
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
            {(search || filterCategory) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterCategory("");
                }}
                className="text-slate-400 hover:text-white text-sm px-3 py-2 border border-slate-700 rounded"
              >
                Clear
              </button>
            )}
          </div>
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
                {displayedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-slate-500"
                    >
                      No items found.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((i) => {
                    const isLow =
                      parseFloat(i.item_quantity) <= parseFloat(i.min_quantity);
                    return (
                      <tr
                        key={i.item_id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-emerald-400 text-xs">
                            {i.item_no}
                          </span>
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
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-bold ${isLow ? "text-red-400" : "text-white"}`}
                          >
                            {i.item_quantity}
                          </span>
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: HO REQUESTS STATUS                          */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "ho-status" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              All requests submitted by Main Store to Head Office
            </p>
            <select
              value={hoFilter}
              onChange={(e) => setHoFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">
                Pending (awaiting manager approval)
              </option>
              <option value="APPROVED">
                Approved (waiting HO fulfillment)
              </option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  {[
                    "Request No",
                    "Requested By",
                    "Date",
                    "Items",
                    "Total Qty",
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
                {filteredHoRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-500"
                    >
                      No HO requests found.
                    </td>
                  </tr>
                ) : (
                  filteredHoRequests.map((r) => (
                    <tr
                      key={r.request_id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 font-mono text-amber-400 text-xs font-bold">
                        {r.request_no}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {r.requested_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        {r.item_count}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.status === "FULFILLED" ? (
                          <span className="text-emerald-400 font-bold">
                            {parseFloat(r.total_fulfilled || 0).toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {parseFloat(r.total_requested || 0).toFixed(0)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetail(r)}
                          className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: NEW HO REQUEST                              */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "ho-create" && (
        <div className="max-w-2xl">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-base">
              New Request to Head Office
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Request items from Head Office to replenish Main Store inventory
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  From (Main Store) *
                </label>
                <select
                  value={hoForm.from_store_id}
                  onChange={(e) =>
                    setHoForm((f) => ({ ...f, from_store_id: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Main Store</option>
                  {mainStores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  To (Head Office) *
                </label>
                <select
                  value={hoForm.to_store_id}
                  onChange={(e) =>
                    setHoForm((f) => ({ ...f, to_store_id: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Head Office</option>
                  {headOffices.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                Requested By *
              </label>
              <input
                value={hoForm.requested_by_name}
                onChange={(e) =>
                  setHoForm((f) => ({
                    ...f,
                    requested_by_name: e.target.value,
                  }))
                }
                placeholder="Your name"
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                Notes
              </label>
              <textarea
                value={hoForm.notes}
                onChange={(e) =>
                  setHoForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                placeholder="Optional reason"
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold uppercase">
                  Items
                </span>
                <button
                  onClick={addLine}
                  className="text-xs text-emerald-400 hover:text-emerald-300 border border-slate-600 rounded px-2 py-1"
                >
                  + Add Row
                </button>
              </div>
              {hoForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800 rounded-lg p-3 grid grid-cols-12 gap-2 items-end mb-2"
                >
                  <div className="col-span-3">
                    <label className="text-slate-500 text-xs mb-1 block">
                      Item No *
                    </label>
                    <input
                      value={item.item_no}
                      onChange={(e) =>
                        updateLine(idx, "item_no", e.target.value)
                      }
                      placeholder="e.g. ITEM-001"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-slate-500 text-xs mb-1 block">
                      Item Name *
                    </label>
                    <input
                      value={item.item_name}
                      onChange={(e) =>
                        updateLine(idx, "item_name", e.target.value)
                      }
                      placeholder="Item description"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-slate-500 text-xs mb-1 block">
                      UOM *
                    </label>
                    <input
                      value={item.item_uom}
                      onChange={(e) =>
                        updateLine(idx, "item_uom", e.target.value)
                      }
                      placeholder="pcs"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-slate-500 text-xs mb-1 block">
                      Qty *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.requested_qty}
                      onChange={(e) =>
                        updateLine(idx, "requested_qty", +e.target.value)
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pb-1">
                    <button
                      onClick={() => removeLine(idx)}
                      disabled={hoForm.items.length === 1}
                      className="text-red-400 hover:text-red-300 disabled:opacity-30 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-700">
              <button
                onClick={handleHoRequest}
                disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40"
              >
                {creating ? "Submitting..." : "Submit Request to Head Office"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
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
                ×
              </button>
            </div>
            <div className="p-5 space-y-3">
              {detailLoad ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Status", <StatusBadge status={detail.status} />],
                      ["From", detail.from_store_name],
                      ["To", detail.to_store_name],
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
                  {detail.rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                      <div className="text-red-400 text-xs font-semibold mb-1">
                        REJECTION REASON
                      </div>
                      <div className="text-red-300 text-sm">
                        {detail.rejection_reason}
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
                          <th className="text-center pb-2">Approved</th>
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
                                  i.approved_qty != null
                                    ? "text-emerald-400"
                                    : "text-slate-600"
                                }
                              >
                                {i.approved_qty ?? "—"}
                              </span>
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
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 rounded disabled:opacity-40"
                      >
                        {fulfilling === detail.request_id
                          ? "Processing..."
                          : "Mark as Fulfilled"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
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
            ×
          </button>
        </div>
      )}
    </div>
  );
}
