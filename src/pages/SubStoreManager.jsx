import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  fulfillRequest,
} from "../services/api";

export default function SubStoreManager() {
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

  const openApprove = async (r) => {
    try {
      const res = await getRequestById(r.request_id);
      const items = res.data.data.items || [];
      setEditedItems(
        items.map((i) => ({ ...i, approved_qty: i.requested_qty })),
      );
      setApproveModal(r);
      setApproverName("");
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
      await fulfillRequest(approveModal.request_id);
      setToast({
        message: "Request approved and inventory updated",
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center py-10 font-semibold">
        {error}
      </div>
    );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const statusColors = {
    PENDING: "bg-amber-500/20 text-amber-400",
    APPROVED: "bg-emerald-500/20 text-emerald-400",
    REJECTED: "bg-red-500/20 text-red-400",
    FULFILLED: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sub Store — Manager</h1>
        <p className="text-slate-400 text-sm">
          Review and approve or reject staff item requests
        </p>
      </div>

      {/* Pending notice */}
      {pendingCount > 0 && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-amber-400 text-sm font-semibold">
            {pendingCount} request{pendingCount > 1 ? "s" : ""} waiting for your
            approval
          </span>
          <button
            className="text-amber-400 border border-amber-400 rounded px-2 py-1 text-xs hover:bg-amber-400/20"
            onClick={() => setFilter("PENDING")}
          >
            Show Pending
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="FULFILLED">Fulfilled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs">
              <th className="text-left pb-2">Request No</th>
              <th className="text-left pb-2">From</th>
              <th className="text-left pb-2">To</th>
              <th className="text-left pb-2">Requested By</th>
              <th className="text-left pb-2">Date</th>
              <th className="text-left pb-2">Status</th>
              <th className="text-left pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-500">
                  No requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.request_id} className="border-b border-slate-700">
                  <td>
                    <span className="font-mono text-emerald-400 text-xs font-bold">
                      {r.request_no}
                    </span>
                  </td>
                  <td>{r.from_store_name}</td>
                  <td>{r.to_store_name}</td>
                  <td>{r.requested_by_name || "—"}</td>
                  <td>
                    <span className="text-slate-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        statusColors[r.status] ||
                        "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="text-blue-400 text-xs px-2 py-1 rounded hover:bg-slate-700/40"
                        onClick={() => openDetail(r)}
                      >
                        Details
                      </button>
                      {r.status === "PENDING" && (
                        <>
                          <button
                            className="bg-emerald-500 text-white text-xs px-2 py-1 rounded hover:bg-emerald-600"
                            onClick={() => openApprove(r)}
                          >
                            Approve
                          </button>
                          <button
                            className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                            onClick={() => {
                              setRejectModal(r);
                              setRejecterName("");
                              setRejectReason("");
                            }}
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

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-900 rounded-lg w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                Request — {detail.request_no}
              </h2>
              <button
                className="text-white text-xl font-bold"
                onClick={() => setDetail(null)}
              >
                ×
              </button>
            </div>
            {detailLoad ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Status", detail.status],
                    ["From", detail.from_store_name],
                    ["To", detail.to_store_name],
                    ["Requested By", detail.requested_by_name || "—"],
                    ["Approved By", detail.approved_by_name || "—"],
                    [
                      "Date",
                      new Date(detail.requested_at).toLocaleDateString(),
                    ],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="bg-slate-800 rounded p-2 flex flex-col"
                    >
                      <span className="text-slate-500 text-xs mb-1">
                        {label}
                      </span>
                      <span className="text-white text-sm">
                        {label === "Status" ? (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              statusColors[val] ||
                              "bg-slate-500/20 text-slate-300"
                            }`}
                          >
                            {val}
                          </span>
                        ) : (
                          val
                        )}
                      </span>
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

                {/* Items Table */}
                <div>
                  <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
                    Items
                  </div>
                  <table className="w-full text-sm border-collapse">
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

                {detail.status === "PENDING" && (
                  <div className="flex gap-2 pt-2 border-t border-slate-700">
                    <button
                      className="bg-emerald-500 text-white text-sm px-3 py-1 rounded hover:bg-emerald-600"
                      onClick={() => {
                        setDetail(null);
                        openApprove(detail);
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => {
                        setDetail(null);
                        setRejectModal(detail);
                        setRejecterName("");
                        setRejectReason("");
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-900 rounded-lg w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                Approve — {approveModal.request_no}
              </h2>
              <button
                className="text-white text-xl font-bold"
                onClick={() => setApproveModal(null)}
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-slate-400 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Manager name"
                />
              </div>

              <div>
                <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
                  Edit quantities if needed
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-center pb-2">Requested</th>
                      <th className="text-center pb-2">Approve Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedItems.map((i, idx) => (
                      <tr
                        key={i.request_item_id}
                        className="border-b border-slate-800"
                      >
                        <td className="py-2">
                          <div className="text-white text-sm">
                            {i.item_name}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {i.item_uom}
                          </div>
                        </td>
                        <td className="py-2 font-mono text-slate-400 text-center">
                          {i.requested_qty}
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={i.requested_qty}
                            value={i.approved_qty}
                            onChange={(e) => {
                              const updated = [...editedItems];
                              updated[idx] = {
                                ...updated[idx],
                                approved_qty: +e.target.value,
                              };
                              setEditedItems(updated);
                            }}
                            className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  className="px-3 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700"
                  onClick={() => setApproveModal(null)}
                >
                  Cancel
                </button>
                <button
                  className={`px-3 py-1 rounded text-white ${
                    !approverName.trim() || actioning
                      ? "bg-slate-600 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                  onClick={handleApprove}
                  disabled={actioning || !approverName.trim()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-900 rounded-lg w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                Reject — {rejectModal.request_no}
              </h2>
              <button
                className="text-white text-xl font-bold"
                onClick={() => setRejectModal(null)}
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-slate-400 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  value={rejecterName}
                  onChange={(e) => setRejecterName(e.target.value)}
                  placeholder="Manager name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-slate-400 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this request is rejected"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  className="px-3 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700"
                  onClick={() => setRejectModal(null)}
                >
                  Cancel
                </button>
                <button
                  className={`px-3 py-1 rounded text-white ${
                    !rejecterName.trim() || !rejectReason.trim() || actioning
                      ? "bg-slate-600 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  onClick={handleReject}
                  disabled={
                    !rejecterName.trim() || !rejectReason.trim() || actioning
                  }
                >
                  {actioning ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white ${
            toast.type === "success"
              ? "bg-emerald-500"
              : toast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{toast.message}</span>
            <button className="ml-2 font-bold" onClick={() => setToast(null)}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
