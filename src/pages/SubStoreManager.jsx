import React, { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
} from "../services/api";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-yellow-50 text-yellow-600 border border-yellow-300",
    APPROVED: "bg-emerald-50 text-emerald-600 border border-emerald-300",
    REJECTED: "bg-red-50 text-red-600 border border-red-300",
    FULFILLED: "bg-blue-50 text-blue-600 border border-blue-300",
    RECEIVED: "bg-teal-50 text-teal-600 border border-teal-300",
    DISPUTED: "bg-amber-50 text-amber-600 border border-amber-300",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${styles[status] || "bg-gray-50 text-gray-500 border border-gray-200"}`}
    >
      {status}
    </span>
  );
};

const DateTimeCell = ({ ts }) => {
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

export default function SubStoreManager() {
  const { auth } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [approveModal, setApproveModal] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  const [actioning, setActioning] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejecterName, setRejecterName] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (filter) params.status = filter;
      if (auth.store_id) params.store_id = auth.store_id;
      const r = await getRequests(params);
      setRequests(r.data.data);
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, auth.store_id]);

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
      setEditedItems(
        (res.data.data.items || []).map((i) => ({
          ...i,
          approved_qty: i.requested_qty,
        })),
      );
      setApproveModal(r);
      setApproverName(auth.username || ""); // ← auto-fill
    } catch {
      setToast({ message: "Failed to load items", type: "error" });
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) return;
    setActioning(true);
    try {
      await approveRequest(approveModal.request_id, {
        approved_by_name: approverName,
        approved_items: editedItems.map((i) => ({
          request_item_id: i.request_item_id,
          approved_qty: i.approved_qty,
        })),
      });
      setToast({
        message: "Request approved — waiting for Main Store Manager",
        type: "success",
      });
      setApproveModal(null);
      setApproverName("");
      setEditedItems([]);
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Error approving",
        type: "error",
      });
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!rejecterName.trim() || !rejectReason.trim()) return;
    setActioning(true);
    try {
      await rejectRequest(rejectModal.request_id, {
        approved_by_name: rejecterName,
        rejection_reason: rejectReason,
      });
      setToast({ message: "Request rejected", type: "info" });
      setRejectModal(null);
      setRejecterName("");
      setRejectReason("");
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Error rejecting",
        type: "error",
      });
    } finally {
      setActioning(false);
    }
  };

  if (loading)
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

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review and approve or reject staff item requests
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-yellow-700 text-sm font-semibold">
            {pendingCount} request{pendingCount > 1 ? "s" : ""} waiting for your
            approval
          </span>
          <button
            onClick={() => setFilter("PENDING")}
            className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1"
          >
            Show Pending
          </button>
        </div>
      )}

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="RECEIVED">Received</option>
          <option value="DISPUTED">Disputed</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "Request No",
                "Requested By",
                "Requested At",
                "Status",
                "Approved At",
                "Fulfilled At",
                "Actions",
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
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";
                return (
                  <React.Fragment>
                    <tr
                      key={r.request_id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        isDisputed
                          ? "bg-amber-50/40 hover:bg-amber-50"
                          : isReceived
                            ? "bg-teal-50/30 hover:bg-teal-50"
                            : "hover:bg-gray-50"
                      } ${isExpanded ? "bg-gray-50" : ""}`}
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
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.requested_at || r.created_at} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.approved_at} />
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.fulfilled_at} />
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
                                  openApprove(r);
                                }}
                                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 ml-1"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRejectModal(r);
                                  setRejecterName(auth.username || "");
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
                        <td colSpan={7} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            detail && (
                              <div className="space-y-3">
                                {/* Info cards */}

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

                                {(isDisputed || isReceived) &&
                                  detail.grn_note && (
                                    <div
                                      className={`rounded-xl p-3 border text-sm ${isDisputed ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-teal-50 border-teal-200 text-teal-700"}`}
                                    >
                                      <div className="text-xs font-bold uppercase tracking-wider mb-1">
                                        {isDisputed
                                          ? "⚠ Sub Store Reported Issues"
                                          : "✓ Sub Store Confirmed Receipt"}
                                      </div>
                                      <div>{detail.grn_note}</div>
                                      {detail.grn_at && (
                                        <div className="text-xs opacity-60 mt-1">
                                          {new Date(
                                            detail.grn_at,
                                          ).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                {/* Items table */}
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
                                        <th className="text-center pb-2 pr-4">
                                          Approved
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
                                          <td className="py-2 pr-4 font-mono text-center">
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

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setApproveModal(null)}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-bold">
                Approve — {approveModal.request_no}
              </h2>
              <button
                onClick={() => setApproveModal(null)}
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
                  value={approverName}
                  readOnly
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Manager name"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
                />
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
                  Adjust quantities if needed
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 text-xs">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-center pb-2">Requested</th>
                      <th className="text-center pb-2">Approve Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedItems.map((i, idx) => (
                      <tr
                        key={i.request_item_id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-2">
                          <div className="text-gray-800 text-sm">
                            {i.item_name}
                          </div>
                          <div className="text-gray-400 text-xs font-mono">
                            {i.item_no} · {i.item_uom}
                          </div>
                        </td>
                        <td className="py-2 font-mono text-gray-500 text-center">
                          {i.requested_qty}
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={i.approved_qty}
                            onChange={(e) => {
                              const u = [...editedItems];
                              u[idx] = {
                                ...u[idx],
                                approved_qty: +e.target.value,
                              };
                              setEditedItems(u);
                            }}
                            className="w-20 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-800 text-sm text-center focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setApproveModal(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actioning || !approverName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
                >
                  {actioning ? "Processing..." : "Confirm Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setRejectModal(null)}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-bold">
                Reject — {rejectModal.request_no}
              </h2>
              <button
                onClick={() => setRejectModal(null)}
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
                  value={rejecterName}
                  onChange={(e) => setRejecterName(e.target.value)}
                  placeholder="Manager name"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this request is rejected"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setRejectModal(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={
                    actioning || !rejecterName.trim() || !rejectReason.trim()
                  }
                  className="bg-red-500 hover:bg-red-400 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
                >
                  {actioning ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}