import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  fulfillRequest,
  getStores,
  getItems,
  createRequest,
} from "../services/api";

const StatusBadge = ({ status }) => {
  const s = {
    PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    MANAGER_APPROVED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
    FULFILLED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || ""}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
};

export default function MainStore() {
  const [tab, setTab] = useState("requests");

  // Requests tab
  const [requests, setRequests] = useState([]);
  // Default filter: show MANAGER_APPROVED — the only ones Main Store can fulfill
  const [reqFilter, setReqFilter] = useState("MANAGER_APPROVED");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);

  // Items tab
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Request from HO tab
  const [mainStores, setMainStores] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [hoForm, setHoForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ item_no: "", item_name: "", item_uom: "", requested_qty: 1 }],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

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
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reqFilter]);

  // Load items when from_store changes in HO form
  useEffect(() => {
    if (hoForm.from_store_id) {
      getItems({ store_id: hoForm.from_store_id }).then((r) =>
        setStoreItems(r.data.data),
      );
    } else {
      setStoreItems([]);
    }
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
      showToast("Request marked as fulfilled and inventory updated");
      setDetail(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fulfill", "error");
    } finally {
      setFulfilling(null);
    }
  };

  // HO request line item helpers
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
      items.some((i) => !i.item_no || i.requested_qty < 1)
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
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to submit", "error");
    } finally {
      setCreating(false);
    }
  };

  // Items filter
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const displayedItems = items.filter((i) => {
    const matchSearch =
      !search ||
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.item_no.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || i.category === filterCategory;
    return matchSearch && matchCat;
  });

  // Count requests ready to fulfill
  const readyToFulfillCount = requests.filter(
    (r) => r.status === "MANAGER_APPROVED",
  ).length;

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

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-white">Main Store</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Fulfill sub store requests · View inventory · Request from Head Office
        </p>
      </div>

      {/* Flow explanation */}
      <div className="mb-4 bg-slate-800/40 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 text-xs">
        <span className="font-semibold text-slate-300">
          Sub Store Approval Flow:{" "}
        </span>
        Sub Store Staff → Sub Store Manager (1st approval) → Main Store Manager
        (final approval) →{" "}
        <span className="text-cyan-400 font-semibold">
          Main Store — you (fulfill)
        </span>
        . Only requests with status{" "}
        <span className="text-cyan-400 font-mono font-semibold">
          MANAGER APPROVED
        </span>{" "}
        can be fulfilled.
      </div>

      {/* Alert if manager-approved requests exist */}
      {tab === "requests" &&
        readyToFulfillCount > 0 &&
        reqFilter !== "MANAGER_APPROVED" && (
          <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-cyan-400 text-sm font-semibold">
              {readyToFulfillCount} request{readyToFulfillCount > 1 ? "s" : ""}{" "}
              ready to fulfill (Manager Approved)
            </span>
            <button
              onClick={() => setReqFilter("MANAGER_APPROVED")}
              className="text-xs border border-slate-600 text-slate-300 hover:text-white rounded px-3 py-1 transition-colors"
            >
              Show them
            </button>
          </div>
        )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-5">
        {[
          { id: "requests", label: "Sub Store Requests" },
          { id: "items", label: "All Items" },
          { id: "ho", label: "Request from Head Office" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Sub Store Requests ─────────────────── */}
      {tab === "requests" && (
        <div>
          <div className="mb-4">
            <select
              value={reqFilter}
              onChange={(e) => setReqFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending (at Sub Manager)</option>
              <option value="APPROVED">
                Approved by Sub Mgr (at Main Mgr)
              </option>
              <option value="MANAGER_APPROVED">
                Manager Approved — Ready to Fulfill
              </option>
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
                    "Sub Mgr",
                    "Main Mgr",
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
                      colSpan={9}
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
                      <td className="px-4 py-3 text-slate-300">
                        {r.from_store_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {r.to_store_name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {r.requested_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {r.approved_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {r.manager_approved_by_name || "—"}
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
                            className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1 transition-colors"
                          >
                            Details
                          </button>
                          {/* Fulfill ONLY allowed after Main Store Manager final approval */}
                          {r.status === "MANAGER_APPROVED" && (
                            <button
                              onClick={() => handleFulfill(r.request_id)}
                              disabled={fulfilling === r.request_id}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 transition-colors disabled:opacity-40"
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

      {/* ── TAB: All Items ──────────────────────────── */}
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

      {/* ── TAB: Request from Head Office ───────────── */}
      {tab === "ho" && (
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

            {/* Items */}
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
              {!hoForm.from_store_id ? (
                <div className="text-slate-500 text-xs text-center py-6 border border-dashed border-slate-700 rounded-lg">
                  Select a Main Store first to load available items
                </div>
              ) : (
                hoForm.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800 rounded-lg p-3 grid grid-cols-12 gap-2 items-end mb-2"
                  >
                    <div className="col-span-5">
                      <label className="text-slate-500 text-xs mb-1 block">
                        Item
                      </label>
                      <select
                        value={item.item_no}
                        onChange={(e) =>
                          updateLine(idx, "item_no", e.target.value)
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select item</option>
                        {storeItems.map((si) => (
                          <option key={si.item_id} value={si.item_no}>
                            {si.item_no} — {si.item_name} (Stock:{" "}
                            {si.item_quantity} {si.item_uom})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-slate-500 text-xs mb-1 block">
                        Name
                      </label>
                      <input
                        value={item.item_name}
                        readOnly
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-400 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-slate-500 text-xs mb-1 block">
                        Qty
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
                    <div className="col-span-1">
                      <label className="text-slate-500 text-xs mb-1 block">
                        UOM
                      </label>
                      <input
                        value={item.item_uom}
                        readOnly
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-400 text-xs text-center"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pb-1">
                      <button
                        onClick={() => removeLine(idx)}
                        disabled={hoForm.items.length === 1}
                        className="text-red-400 hover:text-red-300 disabled:opacity-30 text-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-700">
              <button
                onClick={handleHoRequest}
                disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded transition-colors disabled:opacity-40"
              >
                {creating ? "Submitting..." : "Submit Request to Head Office"}
              </button>
            </div>
          </div>
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
                      ["Sub Mgr Approved By", detail.approved_by_name || "—"],
                      [
                        "Main Mgr Approved By",
                        detail.manager_approved_by_name || "—",
                      ],
                      [
                        "Date",
                        new Date(detail.requested_at).toLocaleDateString(),
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

                  {/* Progress indicator */}
                  <div className="bg-slate-800 rounded p-3">
                    <div className="text-slate-500 text-xs mb-2 font-semibold uppercase">
                      Approval Progress
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${detail.status !== "PENDING" ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {detail.status === "PENDING"
                          ? "⏳ Sub Mgr"
                          : "✓ Sub Mgr"}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span
                        className={`font-semibold ${detail.status === "MANAGER_APPROVED" || detail.status === "FULFILLED" ? "text-cyan-400" : detail.status === "APPROVED" ? "text-amber-400" : "text-slate-600"}`}
                      >
                        {detail.status === "APPROVED"
                          ? "⏳ Main Mgr"
                          : detail.status === "MANAGER_APPROVED" ||
                              detail.status === "FULFILLED"
                            ? "✓ Main Mgr"
                            : "○ Main Mgr"}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span
                        className={`font-semibold ${detail.status === "FULFILLED" ? "text-blue-400" : detail.status === "MANAGER_APPROVED" ? "text-amber-400" : "text-slate-600"}`}
                      >
                        {detail.status === "MANAGER_APPROVED"
                          ? "⏳ Fulfill (you)"
                          : detail.status === "FULFILLED"
                            ? "✓ Fulfilled"
                            : "○ Fulfill"}
                      </span>
                    </div>
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

                  {/* Fulfill button ONLY shown for MANAGER_APPROVED */}
                  {detail.status === "MANAGER_APPROVED" && (
                    <div className="pt-2 border-t border-slate-700">
                      <button
                        onClick={() => handleFulfill(detail.request_id)}
                        disabled={fulfilling === detail.request_id}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 rounded transition-colors disabled:opacity-40"
                      >
                        {fulfilling === detail.request_id
                          ? "Processing..."
                          : "Mark as Fulfilled"}
                      </button>
                    </div>
                  )}

                  {detail.status === "APPROVED" && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-amber-300 text-xs">
                      ⏳ Waiting for <strong>Main Store Manager</strong> to give
                      final approval before you can fulfill this request.
                    </div>
                  )}

                  {detail.status === "PENDING" && (
                    <div className="bg-slate-700/50 border border-slate-600 rounded p-3 text-slate-400 text-xs">
                      ⏳ Waiting for <strong>Sub Store Manager</strong> to
                      approve this request.
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
