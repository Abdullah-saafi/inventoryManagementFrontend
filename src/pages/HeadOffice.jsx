import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  fulfillRequest,
  rejectRequest,
} from "../services/api";

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

export default function HeadOffice() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState(null);

  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);

  const [sendModal, setSendModal] = useState(null);
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejecterName, setRejecterName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "MAIN_TO_HO" };
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

  // Approve then fulfill = "Send"
  const handleSend = async () => {
    if (!senderName.trim()) return;
    setSending(true);
    try {
      await approveRequest(sendModal.request_id, {
        approved_by_name: senderName,
      });
      await fulfillRequest(sendModal.request_id);
      showToast("Request marked as sent and inventory updated");
      setSendModal(null);
      setSenderName("");
      setDetail(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  const handleReject = async () => {
    if (!rejecterName.trim() || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await rejectRequest(rejectModal.request_id, {
        approved_by_name: rejecterName,
        rejection_reason: rejectReason,
      });
      showToast("Request rejected");
      setRejectModal(null);
      setRejecterName("");
      setRejectReason("");
      setDetail(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to reject", "error");
    } finally {
      setRejecting(false);
    }
  };

  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    FULFILLED: requests.filter((r) => r.status === "FULFILLED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
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
      <div className="mb-6">
        <h1 className="text-xl font-black text-white">Head Office</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Review item requests from Main Store and mark them as sent
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="text-amber-400 text-xs uppercase font-semibold mb-1">
            Pending
          </div>
          <div className="text-white font-bold text-2xl font-mono">
            {counts.PENDING}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">Awaiting action</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="text-blue-400 text-xs uppercase font-semibold mb-1">
            Sent
          </div>
          <div className="text-white font-bold text-2xl font-mono">
            {counts.FULFILLED}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">Items dispatched</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="text-red-400 text-xs uppercase font-semibold mb-1">
            Rejected
          </div>
          <div className="text-white font-bold text-2xl font-mono">
            {counts.REJECTED}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">Declined</div>
        </div>
      </div>

      {/* Pending alert */}
      {counts.PENDING > 0 && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-amber-400 text-sm font-semibold">
            {counts.PENDING} request{counts.PENDING > 1 ? "s" : ""} from Main
            Store waiting for your action
          </span>
          <button
            onClick={() => setFilter("PENDING")}
            className="text-xs border border-slate-600 text-slate-300 hover:text-white rounded px-3 py-1 transition-colors"
          >
            Show Pending
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="FULFILLED">Sent</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              {[
                "Request No",
                "From (Main Store)",
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
                <td colSpan={6} className="text-center py-12 text-slate-500">
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
                            onClick={() => {
                              setSendModal(r);
                              setSenderName("");
                            }}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 transition-colors"
                          >
                            Mark Sent
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
                      ["Sent By", detail.approved_by_name || "—"],
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
                      Requested Items
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs">
                          <th className="text-left pb-2">Item</th>
                          <th className="text-left pb-2">UOM</th>
                          <th className="text-center pb-2">Qty Requested</th>
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
                          setSendModal(detail);
                          setSenderName("");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
                      >
                        Mark as Sent
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

      {/* Mark Sent Modal */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSendModal(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Mark as Sent — {sendModal.request_no}
              </h2>
              <button
                onClick={() => setSendModal(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                x
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-emerald-300 text-xs">
                Marking as sent will update the Main Store inventory with the
                requested items.
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Head Office staff name"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="bg-slate-800 rounded p-3 text-sm">
                <div className="text-slate-400 text-xs mb-1">Request</div>
                <div className="text-white font-semibold">
                  {sendModal.request_no}
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  From: {sendModal.from_store_name}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setSendModal(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !senderName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
                >
                  {sending ? "Processing..." : "Confirm Send"}
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
                  placeholder="Head Office staff name"
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
                    rejecting || !rejecterName.trim() || !rejectReason.trim()
                  }
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
                >
                  {rejecting ? "Rejecting..." : "Confirm Reject"}
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
