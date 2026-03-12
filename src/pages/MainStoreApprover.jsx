import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
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

function RejectModal({
  title,
  name,
  setName,
  reason,
  setReason,
  onCancel,
  onConfirm,
  actioning,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-bold">{title}</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
              Your Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Store Manager name"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
              Rejection Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this request is being rejected"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
            <button
              onClick={onCancel}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={actioning || !name.trim() || !reason.trim()}
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
            >
              {actioning ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MainStoreApprover() {
  // ── Sub Store tab: Main Store Manager sees SUB_TO_MAIN requests that are APPROVED
  //    (Sub Store Manager already approved) — but with the new simplified flow,
  //    Main Store Manager is NOT in the SUB_TO_MAIN chain. Sub Manager → Main Store directly.
  //    So this tab only handles MAIN_TO_HO requests.

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const [actorName, setActorName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actioning, setActioning] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      // Main Store Manager only approves MAIN_TO_HO requests
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

  useEffect(() => {
    load();
  }, [filter]);

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

  // PENDING → APPROVED  (using the same /approve endpoint)
  const handleApprove = async () => {
    if (!actorName.trim()) return showToast("Your name is required", "error");
    setActioning(true);
    try {
      await approveRequest(approveModal.request_id, {
        approved_by_name: actorName,
      });
      showToast("Request approved — Head Office can now fulfill it");
      setApproveModal(null);
      setActorName("");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Error approving", "error");
    } finally {
      setActioning(false);
    }
  };

  // PENDING → REJECTED  (using the same /reject endpoint)
  const handleReject = async () => {
    if (!actorName.trim() || !rejectReason.trim())
      return showToast("Name and reason required", "error");
    setActioning(true);
    try {
      await rejectRequest(rejectModal.request_id, {
        approved_by_name: actorName,
        rejection_reason: rejectReason,
      });
      showToast("Request rejected");
      setRejectModal(null);
      setActorName("");
      setRejectReason("");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Error rejecting", "error");
    } finally {
      setActioning(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-white">Main Store Manager</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Approve or reject Main Store requests to Head Office
        </p>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending — Awaiting My Approval</option>
          <option value="APPROVED">Approved — Sent to Head Office</option>
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
                  "Date",
                  "Status",
                  "Actions",
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
                  <td colSpan={5} className="text-center py-12 text-slate-500">
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
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => openDetail(r)}
                          className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1"
                        >
                          Details
                        </button>
                        {r.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => {
                                setApproveModal(r);
                                setActorName("");
                              }}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectModal(r);
                                setActorName("");
                                setRejectReason("");
                              }}
                              className="text-xs bg-red-600 hover:bg-red-500 text-white rounded px-2 py-1"
                            >
                              Reject
                            </button>
                          </>
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
                  {detail.status === "PENDING" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                      <button
                        onClick={() => {
                          setDetail(null);
                          setApproveModal(detail);
                          setActorName("");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setDetail(null);
                          setRejectModal(detail);
                          setActorName("");
                          setRejectReason("");
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {detail.status === "APPROVED" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-emerald-300 text-xs">
                      ✓ Approved — Head Office will see and fulfill this
                      request.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setApproveModal(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Approve — {approveModal.request_no}
              </h2>
              <button
                onClick={() => setApproveModal(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-emerald-300 text-xs">
                Once approved, this request will be visible to{" "}
                <strong>Head Office</strong> who will dispatch the items and
                update Main Store inventory.
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <input
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  placeholder="Main Store Manager name"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setApproveModal(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actioning || !actorName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
                >
                  {actioning
                    ? "Processing..."
                    : "Approve & Send to Head Office"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <RejectModal
          title={`Reject — ${rejectModal.request_no}`}
          name={actorName}
          setName={setActorName}
          reason={rejectReason}
          setReason={setRejectReason}
          onCancel={() => setRejectModal(null)}
          onConfirm={handleReject}
          actioning={actioning}
        />
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
