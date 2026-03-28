import React, { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
} from "../services/api";
import Toast from "../components/Toast";
import { useAuth } from "../context/authContext";
import { FormattedTimestamp } from "../components/FormattedTimestamp";
const BADGE = {
  PENDING: "bg-yellow-50 text-yellow-600 border-yellow-300",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-300",
  REJECTED: "bg-red-50 text-red-600 border-red-300",
  FULFILLED: "bg-blue-50 text-blue-600 border-blue-300",
};
const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${BADGE[status] || "border-gray-300 text-gray-500"}`}
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
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
              Your Name *
            </label>
            <input
              value={name}
              disabled
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Store Manager name"
              className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-400 text-sm cursor-not-allowed outline-none"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
              Rejection Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this request is being rejected"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={actioning || !name.trim() || !reason.trim()}
              className="bg-red-500 hover:bg-red-400 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
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
  const [approveDetail, setApproveDetail] = useState(null)

  const { auth } = useAuth()

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setActorName(auth.username)
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

  useEffect(() => {
    load();
  }, [filter]);

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

  const openApprove = async (r) => {
      try {
        const res = await getRequestById(r.request_id);
        setApproveDetail(res.data.data);
        setApproveModal(r);
      } catch {
        setToast({ message: "Failed to load data", type: "error" });
      }
    };

  const handleApprove = async () => {
    if (!actorName.trim()) return showToast("Your name is required", "error");
    setActioning(true);
    try {
      await approveRequest(approveModal.request_id, {
        approved_by_name: actorName,
      });
      showToast("Request approved — Head Office can now fulfill it");
      setApproveModal(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Error approving", "error");
    } finally {
      setActioning(false);
    }
  };

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
      setRejectReason("");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Error rejecting", "error");
    } finally {
      setActioning(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Main Store Manager</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Approve or reject Main Store requests to Head Office
        </p>
      </div>

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved — Sent to Head Office</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Request No", "Requested By", "Date", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isExpanded =
                    detail && detail.request_id === r.request_id;                    
                  return (
                    <React.Fragment key={r.request_id}>
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
                          <FormattedTimestamp ts={r.created_at} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 items-center">
                            <span
                              className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                            >
                              {isExpanded ? "▲ Hide" : "▼ Details"}
                            </span>
                            {r.status === "PENDING" && (
                              <React.Fragment>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openApprove(r)
                                  }}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 ml-1"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectModal(r);
                                    setRejectReason("");
                                  }}
                                  className="text-xs bg-red-500 hover:bg-red-400 text-white rounded px-2 py-1"
                                >
                                  Reject
                                </button>
                              </React.Fragment>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={r.request_id + "-detail"}
                          className="bg-gray-50 border-b-2 border-emerald-200"
                        >
                          <td colSpan={5} className="px-6 py-4">
                            {detailLoad ? (
                              <div className="flex justify-center py-6">
                                <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                              </div>
                            ) : (
                              detail && (
                                <div className="space-y-3">
                                  {detail.notes && (
                                    <div className="bg-white rounded p-3 border border-gray-200">
                                      <div className="text-gray-400 text-xs mb-1">
                                        NOTES
                                      </div>
                                      <div className="text-gray-700 text-sm">
                                        {detail.notes}
                                      </div>
                                    </div>
                                  )}
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
                                            Fulfilled
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
                                                  i.fulfilled_qty != null
                                                    ? "text-blue-600"
                                                    : "text-gray-300"
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
                                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                                      <button
                                        onClick={() => {
                                          setDetail(null);
                                          setApproveModal(detail);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDetail(null);
                                          setRejectModal(detail);
                                          setRejectReason("");
                                        }}
                                        className="bg-red-500 hover:bg-red-400 text-white text-sm font-semibold px-4 py-2 rounded"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                  {detail.status === "APPROVED" && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-700 text-xs">
                                      ✓ Approved — Head Office will see and
                                      fulfill this request.
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setApproveModal(null)
              setApproveDetail(null)
            }}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-bold">
                Approve — {approveModal.request_no}
              </h2>
              <button
                onClick={() => {
                  setApproveModal(null)
                  setApproveDetail(null)
                }}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-700 text-xs">
                Once approved, this request will be visible to{" "}
                <strong>Head Office</strong> who will dispatch the items and
                update Main Store inventory.
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <input
                  value={actorName}
                  disabled
                  onChange={(e) => setActorName(e.target.value)}
                  placeholder="Main Store Manager name"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-400 text-sm cursor-not-allowed outline-none"
                />
              </div>
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 text-xs">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-center pb-2">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(approveDetail?.items || []).map((i) => (
                      <tr
                        key={i.request_item_id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-2">
                          <div className="text-gray-800 text-sm">
                            {i.item_name}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {i.item_uom}
                          </div>
                        </td>
                        <td className="py-2 font-mono text-gray-500 text-center">
                          {i.requested_qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    setApproveModal(null)
                    setApproveDetail(null)
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
