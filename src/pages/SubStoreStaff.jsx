import { useEffect, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
} from "../services/api";
import { useAuth } from "../context/authContext";

const StatusBadge = ({ status }) => {
  const s = {
    PENDING:   "border-yellow-500 text-yellow-400",
    APPROVED:  "border-emerald-500 text-emerald-400",
    REJECTED:  "border-red-500    text-red-400",
    FULFILLED: "border-blue-500   text-blue-400",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || "border-slate-500 text-slate-400"}`}
    >
      {status}
    </span>
  );
};

const EMPTY_LINE = {
  selected_item_no: "", // tracks dropdown selection only (UI-only)
  item_search: "",      // search filter for catalogue dropdown (UI-only)
  _showDropdown: false, // controls live dropdown visibility (UI-only)
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
};

export default function SubStore() {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilledRequests, setFulfilledRequests] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ ...EMPTY_LINE }],
  });

  const { auth } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin") {
        params.store_id = auth.store_id;
      } else if (filterStore) {
        params.store_id = filterStore;
      }
      const [sRes, rRes] = await Promise.all([
        getStores(),
        getRequests(params),
      ]);
      const all = sRes.data.data;
      setSubStores(all.filter((s) => s.store_type === "SUB_STORE"));
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
      setRequests(rRes.data.data);
      // Load fulfilled for summary
      const fulfilledParams = { direction: "SUB_TO_MAIN", status: "FULFILLED" };
      if (auth.role !== "super admin") fulfilledParams.store_id = auth.store_id;
      else if (filterStore) fulfilledParams.store_id = filterStore;
      const fRes = await getRequests(fulfilledParams);
      setFulfilledRequests(fRes.data.data);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") load();
  }, [filterStatus, filterStore, auth.store_id]);

  useEffect(() => {
    // Show items from Main Store (destination) so sub store sees what is available to request
    const storeToFetch = form.to_store_id || form.from_store_id;
    if (storeToFetch)
      getItems({ store_id: storeToFetch })
        .then((r) => setStoreItems(r.data.data || []))
        .catch(() => setStoreItems([]));
    else setStoreItems([]);
  }, [form.from_store_id, form.to_store_id, showCreate]);

  const openDetail = async (r) => {
    // Toggle: clicking same row collapses it
    if (detail && detail.request_id === r.request_id) {
      setDetail(null);
      return;
    }
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

  const addLine = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));

  const removeLine = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const updateLine = (idx, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };

      // Selecting from dropdown auto-fills the manual fields (still editable)
      if (field === "selected_item_no") {
        if (value) {
          const found = storeItems.find((i) => i.item_no === value);
          if (found) {
            items[idx].item_no = found.item_no;
            items[idx].item_name = found.item_name;
            items[idx].item_uom = found.item_uom;
          }
        } else {
          // Dropdown cleared → wipe manual fields too
          items[idx].item_no = "";
          items[idx].item_name = "";
          items[idx].item_uom = "";
        }
      }

      return { ...f, items };
    });
  };

  const handleCreate = async () => {
    const { from_store_id, to_store_id, requested_by_name, items } = form;
    const invalid = items.some(
      (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
    );
    if (!from_store_id || !to_store_id || !requested_by_name || invalid)
      return setToast({
        message: "Please fill all required fields",
        type: "error",
      });

    setCreating(true);
    try {
      // Strip UI-only field before sending to API
      const payload = {
        ...form,
        direction: "SUB_TO_MAIN",
        items: items.map(({ selected_item_no, item_search, _showDropdown, ...rest }) => rest),
      };
      await createRequest(payload);
      setToast({ message: "Request submitted successfully", type: "success" });
      setShowCreate(false);
      setForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        items: [{ ...EMPTY_LINE }],
      });
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Failed to submit",
        type: "error",
      });
    } finally {
      setCreating(false);
    }
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white">
             {auth.username}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Place item requests and track approval status
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              from_store_id: auth.store_id || "",
              to_store_id: "",
              requested_by_name: auth.username || "",
              notes: "",
              items: [{ ...EMPTY_LINE }],
            });
            setShowCreate(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          New Request
        </button>
      </div>

    

      {/* ── Received Items Breakdown ───────────────────────────────────── */}
      {fulfilledRequests.length > 0 && (
        <div className="mb-5 rounded-lg border border-slate-700 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Items Received from Main Store</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                {["Request No", "Date", "No. of Items", "Total Qty Received"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fulfilledRequests.map(r => (
                <tr key={r.request_id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={() => openDetail(r)}>
                  <td className="px-4 py-2.5 font-mono text-emerald-400 text-xs font-bold">{r.request_no}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{r.item_count}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">{parseFloat(r.total_fulfilled || 0).toFixed(0)}</td>
                </tr>
              ))}
              <tr className="bg-slate-800/60 border-t-2 border-slate-600">
                <td colSpan={3} className="px-4 py-2 text-slate-400 text-xs font-semibold uppercase">Total Received</td>
                <td className="px-4 py-2 font-mono font-bold text-emerald-300 text-base">
                  {fulfilledRequests.reduce((s, r) => s + parseFloat(r.total_fulfilled || 0), 0).toFixed(0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="FULFILLED">Fulfilled</option>
        </select>

        {auth.role === "super admin" && (
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Sub Stores</option>
            {subStores.map((s) => (
              <option key={s.store_id} value={s.store_id}>
                {s.store_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              {[
                "Request No",
                "Requested By",
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
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  No requests found. Click New Request to place one.
                </td>
              </tr>
            ) : (
              requests.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                return (
                  <>
                    <tr
                      key={r.request_id}
                      className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer ${isExpanded ? "bg-slate-800/60" : ""}`}
                      onClick={() => openDetail(r)}
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
                    
                      <td className="px-4 py-3 text-slate-400">{r.requested_by_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs transition-colors ${isExpanded ? "text-emerald-400" : "text-slate-500"}`}>
                          {isExpanded ? "▲ Hide" : "▼ View"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={r.request_id + "-detail"} className="bg-slate-900/80 border-b-2 border-emerald-600/30">
                        <td colSpan={7} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Meta info */}
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  ["Approved By", detail.approved_by_name || "—"],
                                  ["Notes", detail.notes || "—"],
                                  ["Status", <StatusBadge status={detail.status} />],
                                ].map(([label, val]) => (
                                  <div key={label} className="bg-slate-800 rounded p-2">
                                    <div className="text-slate-500 text-xs mb-1">{label}</div>
                                    <div className="text-white text-sm">{val}</div>
                                  </div>
                                ))}
                              </div>
                              {/* Rejection reason */}
                              {detail.rejection_reason && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                                  <div className="text-red-400 text-xs font-semibold mb-1">REJECTION REASON</div>
                                  <div className="text-red-300 text-sm">{detail.rejection_reason}</div>
                                </div>
                              )}
                              {/* Items table */}
                              <div>
                                <div className="text-slate-400 text-xs uppercase font-semibold mb-2">Items</div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-700 text-slate-400 text-xs">
                                      <th className="text-left pb-2 pr-4">Item No</th>
                                      <th className="text-left pb-2 pr-4">Item Name</th>
                                      <th className="text-left pb-2 pr-4">UOM</th>
                                      <th className="text-center pb-2 pr-4">Requested</th>
                                      <th className="text-center pb-2">Approved</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(detail.items || []).map((i) => (
                                      <tr key={i.request_item_id} className="border-b border-slate-800">
                                        <td className="py-2 pr-4 font-mono text-emerald-400 text-xs">{i.item_no}</td>
                                        <td className="py-2 pr-4 text-white">{i.item_name}</td>
                                        <td className="py-2 pr-4 text-slate-400 text-xs">{i.item_uom}</td>
                                        <td className="py-2 pr-4 font-mono text-white text-center">{i.requested_qty}</td>
                                        <td className="py-2 font-mono text-center">
                                          <span className={i.approved_qty != null ? "text-emerald-400" : "text-slate-600"}>
                                            {i.approved_qty ?? "—"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">New Item Request</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Store selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Sub Store *
                  </label>
                  {auth.role === "super admin" ? (
                    <select
                      value={form.from_store_id}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          from_store_id: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Sub Store</option>
                      {subStores.map((s) => (
                        <option key={s.store_id} value={s.store_id}>
                          {s.store_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={auth.storeName || "Loading..."}
                      readOnly
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-400 text-sm cursor-not-allowed outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Main Store *
                  </label>
                  <select
                    value={form.to_store_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, to_store_id: e.target.value }))
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
              </div>

              {/* Requested by */}
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Requested By *
                </label>
                <input
                  value={form.requested_by_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      requested_by_name: e.target.value,
                    }))
                  }
                  placeholder="Your name"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
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

                {!form.from_store_id ? (
                  <div className="text-slate-500 text-xs text-center py-6 border border-dashed border-slate-700 rounded-lg">
                    Select a Sub Store first
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                      >
                        {/* Row header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            Item {idx + 1}
                          </span>
                          <button
                            onClick={() => removeLine(idx)}
                            disabled={form.items.length === 1}
                            className="text-red-400 hover:text-red-300 disabled:opacity-30 text-lg font-bold leading-none"
                          >
                            ×
                          </button>
                        </div>

                        {/* Catalogue search + live dropdown */}
                        <div className="mb-3">
                          <label className="text-slate-400 text-xs mb-1 flex items-center gap-1.5">
                            <span>Select from catalogue</span>
                         
                          </label>
                          <div className="relative mt-1.5">
                            <input
                              value={item.item_search}
                              onChange={(e) => {
                                updateLine(idx, "item_search", e.target.value);
                                updateLine(idx, "_showDropdown", true);
                              }}
                              onFocus={() => updateLine(idx, "_showDropdown", true)}
                              onBlur={() => setTimeout(() => updateLine(idx, "_showDropdown", false), 150)}
                              placeholder="Search by item name or number…"
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                            />
                            {item._showDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                <div
                                  className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-700 cursor-pointer"
                                  onMouseDown={() => {
                                    updateLine(idx, "selected_item_no", "");
                                    updateLine(idx, "item_search", "");
                                    updateLine(idx, "_showDropdown", false);
                                  }}
                                >
                                  — Not listed / enter manually —
                                </div>
                                {storeItems
                                  .filter(si => {
                                    const q = (item.item_search || "").toLowerCase();
                                    if (!q) return true;
                                    return si.item_no.toLowerCase().includes(q) || si.item_name.toLowerCase().includes(q);
                                  })
                                  .map(si => (
                                    <div
                                      key={si.item_id}
                                      onMouseDown={() => {
                                        updateLine(idx, "selected_item_no", si.item_no);
                                        updateLine(idx, "item_search", si.item_no + " — " + si.item_name);
                                        updateLine(idx, "_showDropdown", false);
                                      }}
                                      className={`px-3 py-2 cursor-pointer hover:bg-slate-700 border-t border-slate-700/50 ${item.selected_item_no === si.item_no ? "bg-emerald-600/20" : ""}`}
                                    >
                                      <span className="font-mono text-emerald-400 text-xs">{si.item_no}</span>
                                      <span className="text-white text-xs ml-2">{si.item_name}</span>
                                    </div>
                                  ))}
                                {storeItems.filter(si => {
                                  const q = (item.item_search || "").toLowerCase();
                                  return !q || si.item_no.toLowerCase().includes(q) || si.item_name.toLowerCase().includes(q);
                                }).length === 0 && (
                                  <div className="px-3 py-2 text-xs text-slate-600 italic">No items match your search</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Subtle divider */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-px bg-slate-700" />
                          <span className="text-slate-600 text-xs">
                            item details
                          </span>
                          <div className="flex-1 h-px bg-slate-700" />
                        </div>

                        {/* Manual fields — always visible, auto-populated by dropdown */}
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-2">
                            <label className="text-slate-400 text-xs mb-1 block">
                              Item No *
                            </label>
                            <input
                              value={item.item_no}
                              onChange={(e) =>
                                updateLine(idx, "item_no", e.target.value)
                              }
                              placeholder="e.g. ITM-001"
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="text-slate-400 text-xs mb-1 block">
                              Item Name *
                            </label>
                            <input
                              value={item.item_name}
                              onChange={(e) =>
                                updateLine(idx, "item_name", e.target.value)
                              }
                              placeholder="Full item name"
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-slate-400 text-xs mb-1 block">
                              UOM *
                            </label>
                            <input
                              value={item.item_uom}
                              onChange={(e) =>
                                updateLine(idx, "item_uom", e.target.value)
                              }
                              placeholder="pcs / kg…"
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-slate-400 text-xs mb-1 block">
                              Available
                            </label>
                            {(() => {
                              const found = storeItems.find(si => si.item_no === item.item_no);
                              return found ? (
                                <div className="w-full bg-slate-600 border border-slate-700 rounded px-2 py-1.5 text-sm  ">
                                  {parseFloat(found.item_quantity).toFixed(0)} {found.item_uom}
                                </div>
                              ) : (
                                <div className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-600 italic">
                                  —
                                </div>
                              );
                            })()}
                          </div>
                          <div className="col-span-2">
                            <label className="text-slate-400 text-xs mb-1 block">
                              Qty *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.requested_qty}
                              onChange={(e) =>
                                updateLine(
                                  idx,
                                  "requested_qty",
                                  +e.target.value,
                                )
                              }
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setShowCreate(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
                >
                  {creating ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : "bg-red-500/20 border-red-500/40 text-red-300"
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