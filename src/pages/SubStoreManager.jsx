import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
} from "../services/api";
import { useAuth } from "../context/authContext";

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    APPROVED: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    REJECTED: "bg-red-500/20 text-red-400 border border-red-500/30",
    FULFILLED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${styles[status] || ""}`}
    >
      {status}
    </span>
  );
};

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

  const {auth} = useAuth()

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (filter) params.status = filter;
      if (auth.role !== "super admin" && auth.store_id) {
        params.store_id = auth.store_id; 
      }
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
  }, [filter, auth]);

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
      setEditedItems(
        (res.data.data.items || []).map((i) => ({
          ...i,
          approved_qty: i.requested_qty,
        })),
      );
      setApproveModal(r);
      setApproverName(auth.username || "");
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
        message: "Request approved — waiting for Main Store to fulfill",
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
      setRejecterName(auth.username || "");
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
        <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
        {error}
      </div>
    );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white">
            {auth.username || "Manager"} — {auth.storeName || "Store"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Review and approve or reject staff item requests
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-amber-400 text-sm font-semibold">
            {pendingCount} request{pendingCount > 1 ? "s" : ""} waiting for your
            approval
          </span>
          <button
            onClick={() => setFilter("PENDING")}
            className="text-xs border border-slate-600 text-slate-300 hover:text-white rounded px-3 py-1 transition-colors"
          >
            Show Pending
          </button>
        </div>
      )}

      <div className="mb-4">
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
                <td colSpan={7} className="text-center py-12 text-slate-500">
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
                      {r.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => openApprove(r)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectModal(r);
                              setRejecterName("");
                              setRejectReason("");
                            }}
                            className="text-xs bg-red-600 hover:bg-red-500 text-white rounded px-2 py-1 transition-colors"
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
                  {detail.status === "PENDING" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                      <button
                        onClick={() => {
                          setDetail(null);
                          openApprove(detail);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setDetail(null);
                          setRejectModal(detail);
                          setRejecterName("");
                          setRejectReason("");
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
                      >
                        Reject
                      </button>
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
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Approve — {approveModal.request_no}
              </h2>
              <button
                onClick={() => setApproveModal(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                x
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <input
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Manager name"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
                  Edit quantities if needed
                </div>
                <table className="w-full text-sm">
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
                              const u = [...editedItems];
                              u[idx] = {
                                ...u[idx],
                                approved_qty: +e.target.value,
                              };
                              setEditedItems(u);
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
                  onClick={() => setApproveModal(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actioning || !approverName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
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
            className="absolute inset-0 bg-black/70"
            onClick={() => setRejectModal(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Reject — {rejectModal.request_no}
              </h2>
              <button
                onClick={() => setRejectModal(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                x
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <input
                  value={rejecterName}
                  onChange={(e) => setRejecterName(e.target.value)}
                  placeholder="Manager name"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this request is rejected"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setRejectModal(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={
                    actioning || !rejecterName.trim() || !rejectReason.trim()
                  }
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
                >
                  {actioning ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium ${toast.type === "success" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : toast.type === "error" ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-blue-500/20 border-blue-500/40 text-blue-300"}`}
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
