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
    PENDING: "border-yellow-400 text-yellow-600 bg-yellow-50",
    APPROVED: "border-emerald-400 text-emerald-600 bg-emerald-50",
    REJECTED: "border-red-400 text-red-600 bg-red-50",
    FULFILLED: "border-blue-400 text-blue-600 bg-blue-50",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || "border-gray-300 text-gray-500 bg-gray-50"}`}
    >
      {status}
    </span>
  );
};

const getStatusTimestamp = (r) => {
  if (r.status === "FULFILLED") return r.fulfilled_at;
  if (r.status === "APPROVED") return r.approved_at;
  if (r.status === "REJECTED") return r.approved_at;
  return null;
};

const UpdatedAtCell = ({ r }) => {
  const ts = getStatusTimestamp(r);
  if (!ts) return <span className="text-gray-300 text-xs">—</span>;
  const d = new Date(ts);
  return (
    <div>
      <div className="text-gray-600 text-xs font-mono">
        {d.toLocaleDateString()}
      </div>
      <div className="text-gray-400 text-xs font-mono">
        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
};

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
};

export default function SubStore() {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
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
    setPageLoading(true);
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
      const fulfilledParams = { direction: "SUB_TO_MAIN", status: "FULFILLED" };
      if (auth.role !== "super admin") fulfilledParams.store_id = auth.store_id;
      else if (filterStore) fulfilledParams.store_id = filterStore;
      const fRes = await getRequests(fulfilledParams);
      setFulfilledRequests(fRes.data.data);
    } catch {
      setError("Failed to load data");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") load();
  }, [filterStatus, filterStore, auth.store_id]);

  useEffect(() => {
    const storeToFetch = form.to_store_id || form.from_store_id;
    if (storeToFetch)
      getItems({ store_id: storeToFetch })
        .then((r) => setStoreItems(r.data.data || []))
        .catch(() => setStoreItems([]));
    else setStoreItems([]);
  }, [form.from_store_id, form.to_store_id, showCreate]);

  const openDetail = async (r) => {
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
      if (field === "selected_item_no") {
        if (value) {
          const found = storeItems.find((i) => i.item_no === value);
          if (found) {
            items[idx].item_no = found.item_no;
            items[idx].item_name = found.item_name;
            items[idx].item_uom = found.item_uom;
          }
        } else {
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
      const payload = {
        ...form,
        direction: "SUB_TO_MAIN",
        items: items.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
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

  if (pageLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
        {error}
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
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
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
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
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "Request No",
                "Requested By",
                "Date",
                "Status",
                "Updated At",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
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
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => openDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-emerald-600 text-xs font-bold">
                          {r.request_no}
                        </span>
                        {r.item_count > 0 && (
                          <span className="ml-2 bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                            {r.item_count} item{r.item_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.requested_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <UpdatedAtCell r={r} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs transition-colors ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                        >
                          {isExpanded ? "▲ Hide" : "▼ View"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr
                        key={r.request_id + "-detail"}
                        className="bg-gray-50 border-b-2 border-emerald-200"
                      >
                        <td colSpan={6} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2">
                                {[,].map(([label, val]) => (
                                  <div
                                    key={label}
                                    className="bg-white rounded p-2 border border-gray-200"
                                  >
                                    <div className="text-gray-400 text-xs mb-1">
                                      {label}
                                    </div>
                                    <div className="text-gray-800 text-sm">
                                      {val}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {detail.rejection_reason && (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                  <div className="text-red-500 text-xs font-semibold mb-1">
                                    REJECTION REASON
                                  </div>
                                  <div className="text-red-600 text-sm">
                                    {detail.rejection_reason}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
                                  Items
                                </div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 text-gray-400 text-xs">
                                      <th className="text-left pb-2 pr-4">
                                        Item No
                                      </th>
                                      <th className="text-left pb-2 pr-4">
                                        Item Name
                                      </th>
                                      <th className="text-left pb-2 pr-4">
                                        UOM
                                      </th>
                                      <th className="text-center pb-2 pr-4">
                                        Requested
                                      </th>
                                      <th className="text-center pb-2">
                                        Approved
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(detail.items || []).map((i) => (
                                      <tr
                                        key={i.request_item_id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                                          {i.item_no}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-800">
                                          {i.item_name}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-400 text-xs">
                                          {i.item_uom}
                                        </td>
                                        <td className="py-2 pr-4 font-mono text-gray-800 text-center">
                                          {i.requested_qty}
                                        </td>
                                        <td className="py-2 font-mono text-center">
                                          <span
                                            className={
                                              i.approved_qty != null
                                                ? "text-emerald-600"
                                                : "text-gray-300"
                                            }
                                          >
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

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-bold">New Item Request</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
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
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
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
                      value={
                        subStores.find((s) => s.store_id === auth.store_id)
                          ?.store_name ?? "Loading..."
                      }
                      readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-400 text-sm cursor-not-allowed outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Main Store *
                  </label>
                  <select
                    value={form.to_store_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, to_store_id: e.target.value }))
                    }
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
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

              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Requested By *
                </label>
                <input
                  value={form.requested_by_name}
                  readOnly
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      requested_by_name: e.target.value,
                    }))
                  }
                  placeholder="Your name"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Optional reason"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs font-semibold uppercase">
                    Items
                  </span>
                  <button
                    onClick={addLine}
                    className="text-xs text-emerald-600 hover:text-emerald-500 border border-gray-300 rounded px-2 py-1"
                  >
                    + Add Row
                  </button>
                </div>

                {!form.from_store_id ? (
                  <div className="text-gray-400 text-xs text-center py-6 border border-dashed border-gray-300 rounded-lg">
                    Select a Sub Store first
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                            Item {idx + 1}
                          </span>
                          <button
                            onClick={() => removeLine(idx)}
                            disabled={form.items.length === 1}
                            className="text-red-400 hover:text-red-500 disabled:opacity-30 text-lg font-bold leading-none"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mb-3">
                          <label className="text-gray-500 text-xs mb-1 flex items-center gap-1.5">
                            <span>Select from catalogue</span>
                          </label>
                          <div className="relative mt-1.5">
                            <input
                              value={item.item_search}
                              onChange={(e) => {
                                updateLine(idx, "item_search", e.target.value);
                                updateLine(idx, "_showDropdown", true);
                              }}
                              onFocus={() =>
                                updateLine(idx, "_showDropdown", true)
                              }
                              onBlur={() =>
                                setTimeout(
                                  () => updateLine(idx, "_showDropdown", false),
                                  150,
                                )
                              }
                              placeholder="Search by item name or number…"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                            />
                            {item._showDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                <div
                                  className="px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer"
                                  onMouseDown={() => {
                                    updateLine(idx, "selected_item_no", "");
                                    updateLine(idx, "item_search", "");
                                    updateLine(idx, "_showDropdown", false);
                                  }}
                                >
                                  — Not listed / enter manually —
                                </div>
                                {storeItems
                                  .filter((si) => {
                                    const q = (
                                      item.item_search || ""
                                    ).toLowerCase();
                                    if (!q) return true;
                                    return (
                                      si.item_no.toLowerCase().includes(q) ||
                                      si.item_name.toLowerCase().includes(q)
                                    );
                                  })
                                  .map((si) => (
                                    <div
                                      key={si.item_id}
                                      onMouseDown={() => {
                                        updateLine(
                                          idx,
                                          "selected_item_no",
                                          si.item_no,
                                        );
                                        updateLine(
                                          idx,
                                          "item_search",
                                          si.item_no + " — " + si.item_name,
                                        );
                                        updateLine(idx, "_showDropdown", false);
                                      }}
                                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-t border-gray-100 ${item.selected_item_no === si.item_no ? "bg-emerald-50" : ""}`}
                                    >
                                      <span className="font-mono text-emerald-600 text-xs">
                                        {si.item_no}
                                      </span>
                                      <span className="text-gray-800 text-xs ml-2">
                                        {si.item_name}
                                      </span>
                                    </div>
                                  ))}
                                {storeItems.filter((si) => {
                                  const q = (
                                    item.item_search || ""
                                  ).toLowerCase();
                                  return (
                                    !q ||
                                    si.item_no.toLowerCase().includes(q) ||
                                    si.item_name.toLowerCase().includes(q)
                                  );
                                }).length === 0 && (
                                  <div className="px-3 py-2 text-xs text-gray-400 italic">
                                    No items match your search
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-gray-400 text-xs">
                            item details
                          </span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-2">
                            <label className="text-gray-500 text-xs mb-1 block">
                              Item No *
                            </label>
                            <input
                              value={item.item_no}
                              onChange={(e) =>
                                updateLine(idx, "item_no", e.target.value)
                              }
                              placeholder="e.g. ITM-001"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="text-gray-500 text-xs mb-1 block">
                              Item Name *
                            </label>
                            <input
                              value={item.item_name}
                              onChange={(e) =>
                                updateLine(idx, "item_name", e.target.value)
                              }
                              placeholder="Full item name"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-gray-500 text-xs mb-1 block">
                              UOM *
                            </label>
                            <input
                              value={item.item_uom}
                              onChange={(e) =>
                                updateLine(idx, "item_uom", e.target.value)
                              }
                              placeholder="pcs / kg…"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-gray-500 text-xs mb-1 block">
                              Available
                            </label>
                            {(() => {
                              const found = storeItems.find(
                                (si) => si.item_no === item.item_no,
                              );
                              return found ? (
                                <div className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700">
                                  {parseFloat(found.item_quantity).toFixed(0)}{" "}
                                  {found.item_uom}
                                </div>
                              ) : (
                                <div className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-400 italic">
                                  —
                                </div>
                              );
                            })()}
                          </div>
                          <div className="col-span-2">
                            <label className="text-gray-500 text-xs mb-1 block">
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
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setShowCreate(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded transition-colors"
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
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
