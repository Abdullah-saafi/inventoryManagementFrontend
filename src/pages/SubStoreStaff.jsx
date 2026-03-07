import { use, useEffect, useState } from "react";
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
    PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
    FULFILLED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || ""}`}
    >
      {status}
    </span>
  );
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
  const [showCreate, setShowCreate] = useState(false);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ item_no: "", item_name: "", item_uom: "", requested_qty: 1 }],
  });

  const { auth } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (filterStatus) params.status = filterStatus;
      if (filterStore) params.store_id = filterStore;
      const [sRes, rRes] = await Promise.all([
        getStores(),
        getRequests(params),
      ]);
      const all = sRes.data.data;
      setSubStores(all.filter((s) => s.store_type === "SUB_STORE"));
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
      setRequests(rRes.data.data);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus, filterStore]);

  useEffect(() => {
    if (form.from_store_id)
      getItems({ store_id: form.from_store_id }).then((r) =>
        setStoreItems(r.data.data),
      );
    else setStoreItems([]);
  }, [form.from_store_id]);

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

  const addLine = () =>
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { item_no: "", item_name: "", item_uom: "", requested_qty: 1 },
      ],
    }));
  const removeLine = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx, field, value) => {
    setForm((f) => {
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

  const handleCreate = async () => {
    const { from_store_id, to_store_id, requested_by_name, items } = form;
    if (
      !from_store_id ||
      !to_store_id ||
      !requested_by_name ||
      items.some((i) => !i.item_no || i.requested_qty < 1)
    )
      return setToast({
        message: "Please fill all required fields",
        type: "error",
      });
    setCreating(true);
    try {
      await createRequest({ ...form, direction: "SUB_TO_MAIN" });
      setToast({ message: "Request submitted successfully", type: "success" });
      setShowCreate(false);
      setForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        items: [{ item_no: "", item_name: "", item_uom: "", requested_qty: 1 }],
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white">
            Sub Store User {auth.username}
          </h1>

          <p className="text-slate-400 text-sm mt-0.5">
            Place item requests and track approval status
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          New Request
        </button>
      </div>

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
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(r)}
                      className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
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
                className="text-slate-400 hover:text-white text-xl"
              >
                x
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Sub Store *
                  </label>
                  <select
                    value={form.from_store_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, from_store_id: e.target.value }))
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
                  form.items.map((item, idx) => (
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
                          disabled={form.items.length === 1}
                          className="text-red-400 hover:text-red-300 disabled:opacity-30 text-lg font-bold"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                x
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium ${toast.type === "success" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-red-500/20 border-red-500/40 text-red-300"}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-60 hover:opacity-100"
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}
