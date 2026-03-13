import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
<<<<<<< HEAD
  managerApproveRequest,
  managerRejectRequest,
  hoApproveRequest,
  hoRejectRequest,
} from "../services/api";
// ─── Status Badge ─────────────────────────────────────────────────────────────
const BADGE = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MANAGER_APPROVED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  FULFILLED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  HO_PENDING: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  HO_APPROVED: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  HO_FULFILLED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};
const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${BADGE[status] || ""}`}
  >
    {status?.replace(/_/g, " ")}
  </span>
);

// ─── Items Table ────────────────────────────────────────────────────────────
function ItemsTable({ items = [] }) {
  if (!items.length)
    return <p className="text-slate-500 text-xs">No items loaded.</p>;
  return (
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
            <th className="text-center pb-2">Sub Mgr Approved</th>
            <th className="text-center pb-2">Main Mgr Approved</th>
            <th className="text-center pb-2">Fulfilled</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.request_item_id} className="border-b border-slate-800">
              <td className="py-2 text-white">{i.item_name}</td>
              <td className="py-2 text-slate-400 text-xs">{i.item_uom}</td>
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
                    i.manager_approved_qty != null
                      ? "text-cyan-400"
                      : "text-slate-600"
                  }
                >
                  {i.manager_approved_qty ?? "—"}
                </span>
              </td>
              <td className="py-2 font-mono text-center">
                <span
                  className={
                    i.fulfilled_qty != null ? "text-blue-400" : "text-slate-600"
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
  );
}

// ─── Audit Trail ────────────────────────────────────────────────────────────
const AUDIT_LABELS = {
  CREATED: { label: "Created", color: "text-slate-300" },
  SUB_MANAGER_APPROVED: {
    label: "Sub Mgr Approved",
    color: "text-emerald-400",
  },
  SUB_MANAGER_REJECTED: { label: "Sub Mgr Rejected", color: "text-red-400" },
  MAIN_MANAGER_APPROVED: { label: "Main Mgr Approved", color: "text-cyan-400" },
  MAIN_MANAGER_REJECTED: { label: "Main Mgr Rejected", color: "text-red-400" },
  HO_REQUEST_APPROVED: { label: "Approved for HO", color: "text-purple-400" },
  HO_REQUEST_REJECTED: { label: "HO Rejected", color: "text-red-400" },
  HO_FULFILLED: { label: "Fulfilled by HO", color: "text-teal-400" },
  FULFILLED: { label: "Fulfilled", color: "text-blue-400" },
};
function AuditTrail({ audit = [] }) {
  if (!audit.length) return null;
  return (
    <div>
      <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
        Audit History
      </div>
      <div className="space-y-1">
        {audit.map((a) => (
          <div
            key={a.audit_id}
            className="bg-slate-800 rounded p-2 flex items-start gap-3 text-xs"
          >
            <span
              className={`font-semibold w-40 shrink-0 ${AUDIT_LABELS[a.action]?.color || "text-slate-400"}`}
            >
              {AUDIT_LABELS[a.action]?.label || a.action}
            </span>
            <span className="text-slate-400">{a.performed_by || "—"}</span>
            {a.notes && <span className="text-slate-600">— {a.notes}</span>}
            <span className="text-slate-600 ml-auto whitespace-nowrap">
              {new Date(a.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reject Modal ────────────────────────────────────────────────────────────
=======
  approveRequest,
  rejectRequest,
} from "../services/api";

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

>>>>>>> phase-01
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
<<<<<<< HEAD
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-bold">{title}</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-xl"
=======
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 text-xl"
>>>>>>> phase-01
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
<<<<<<< HEAD
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
=======
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
>>>>>>> phase-01
              Your Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Store Manager name"
<<<<<<< HEAD
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
=======
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
>>>>>>> phase-01
              Rejection Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this request is being rejected"
<<<<<<< HEAD
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
            <button
              onClick={onCancel}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded"
=======
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
>>>>>>> phase-01
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={actioning || !name.trim() || !reason.trim()}
<<<<<<< HEAD
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
=======
              className="bg-red-500 hover:bg-red-400 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
>>>>>>> phase-01
            >
              {actioning ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MainStoreManager() {
  const [mainTab, setMainTab] = useState("substore");

  // ── Sub Store Final Approvals ─────────────────────────────────────────────
  // Main Store Manager sees requests that Sub Store Manager already approved (status = APPROVED)
  const [subRequests, setSubRequests] = useState([]);
  const [subFilter, setSubFilter] = useState("APPROVED");
  const [subLoading, setSubLoading] = useState(true);
  const [subDetail, setSubDetail] = useState(null);
  const [subDetailLoad, setSubDL] = useState(false);
  const [subApproveModal, setSubApproveModal] = useState(null);
  const [subEditedItems, setSubEditedItems] = useState([]);
  const [subRejectModal, setSubRejectModal] = useState(null);

  // ── HO Request Approvals ──────────────────────────────────────────────────
  const [hoRequests, setHoRequests] = useState([]);
  const [hoFilter, setHoFilter] = useState("HO_PENDING");
  const [hoLoading, setHoLoading] = useState(true);
  const [hoDetail, setHoDetail] = useState(null);
  const [hoDetailLoad, setHoDL] = useState(false);
  const [hoApproveModal, setHoApproveModal] = useState(null);
  const [hoRejectModal, setHoRejectModal] = useState(null);

  // ── Shared form state ─────────────────────────────────────────────────────
=======
export default function MainStoreApprover() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
>>>>>>> phase-01
  const [actorName, setActorName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actioning, setActioning] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

<<<<<<< HEAD
  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadSub = async () => {
    setSubLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (subFilter) params.status = subFilter;
      const r = await getRequests(params);
      setSubRequests(r.data.data);
    } catch {
      showToast("Failed to load sub store requests", "error");
    } finally {
      setSubLoading(false);
    }
  };

  const loadHo = async () => {
    setHoLoading(true);
    try {
      const params = { direction: "MAIN_TO_HO" };
      if (hoFilter) params.status = hoFilter;
      const r = await getRequests(params);
      setHoRequests(r.data.data);
    } catch {
      showToast("Failed to load HO requests", "error");
    } finally {
      setHoLoading(false);
=======
  const load = async () => {
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
>>>>>>> phase-01
    }
  };

  useEffect(() => {
<<<<<<< HEAD
    loadSub();
  }, [subFilter]);
  useEffect(() => {
    loadHo();
  }, [hoFilter]);

  // ── Detail openers ────────────────────────────────────────────────────────
  const openSubDetail = async (r) => {
    setSubDL(true);
    setSubDetail({ ...r, items: [], audit: [] });
    try {
      const res = await getRequestById(r.request_id);
      setSubDetail(res.data.data);
    } catch {
    } finally {
      setSubDL(false);
    }
  };

  const openHoDetail = async (r) => {
    setHoDL(true);
    setHoDetail({ ...r, items: [], audit: [] });
    try {
      const res = await getRequestById(r.request_id);
      setHoDetail(res.data.data);
    } catch {
    } finally {
      setHoDL(false);
    }
  };

  const openSubApprove = async (r) => {
    try {
      const res = await getRequestById(r.request_id);
      setSubEditedItems(
        (res.data.data.items || []).map((i) => ({
          ...i,
          // Pre-fill with sub manager's approved qty, fallback to requested
          approved_qty: i.approved_qty ?? i.requested_qty,
        })),
      );
      setSubApproveModal(r);
      setActorName("");
    } catch {
      showToast("Failed to load request items", "error");
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  // Final approval by Main Store Manager → sets status to MANAGER_APPROVED
  // Main Store staff can only fulfill after this step
  const handleSubApprove = async () => {
    if (!actorName.trim()) return showToast("Your name is required", "error");
    setActioning(true);
    try {
      await managerApproveRequest(subApproveModal.request_id, {
        manager_approved_by_name: actorName,
        approved_items: subEditedItems.map((i) => ({
          request_item_id: i.request_item_id,
          approved_qty: i.approved_qty,
        })),
      });
      showToast(
        "Final approval granted — Main Store can now fulfill this request",
      );
      setSubApproveModal(null);
      setActorName("");
      setSubEditedItems([]);
      loadSub();
=======
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
>>>>>>> phase-01
    } catch (e) {
      showToast(e.response?.data?.message || "Error approving", "error");
    } finally {
      setActioning(false);
    }
  };

<<<<<<< HEAD
  const handleSubReject = async () => {
=======
  const handleReject = async () => {
>>>>>>> phase-01
    if (!actorName.trim() || !rejectReason.trim())
      return showToast("Name and reason required", "error");
    setActioning(true);
    try {
<<<<<<< HEAD
      await managerRejectRequest(subRejectModal.request_id, {
        manager_approved_by_name: actorName,
        manager_rejection_reason: rejectReason,
      });
      showToast("Request rejected", "info");
      setSubRejectModal(null);
      setActorName("");
      setRejectReason("");
      loadSub();
=======
      await rejectRequest(rejectModal.request_id, {
        approved_by_name: actorName,
        rejection_reason: rejectReason,
      });
      showToast("Request rejected");
      setRejectModal(null);
      setActorName("");
      setRejectReason("");
      load();
>>>>>>> phase-01
    } catch (e) {
      showToast(e.response?.data?.message || "Error rejecting", "error");
    } finally {
      setActioning(false);
    }
  };

<<<<<<< HEAD
  const handleHoApprove = async () => {
    if (!actorName.trim()) return showToast("Your name is required", "error");
    setActioning(true);
    try {
      await hoApproveRequest(hoApproveModal.request_id, {
        manager_approved_by_name: actorName,
      });
      showToast("HO request approved — Head Office will see and fulfill it");
      setHoApproveModal(null);
      setActorName("");
      loadHo();
    } catch (e) {
      showToast(e.response?.data?.message || "Error approving", "error");
    } finally {
      setActioning(false);
    }
  };

  const handleHoReject = async () => {
    if (!actorName.trim() || !rejectReason.trim())
      return showToast("Name and reason required", "error");
    setActioning(true);
    try {
      await hoRejectRequest(hoRejectModal.request_id, {
        manager_approved_by_name: actorName,
        manager_rejection_reason: rejectReason,
      });
      showToast("HO request rejected", "info");
      setHoRejectModal(null);
      setActorName("");
      setRejectReason("");
      loadHo();
    } catch (e) {
      showToast(e.response?.data?.message || "Error rejecting", "error");
    } finally {
      setActioning(false);
    }
  };

  // ── Badge counts ──────────────────────────────────────────────────────────
  // Requests awaiting THIS manager = status APPROVED (sub mgr already approved)
  const subPendingCount = subRequests.filter(
    (r) => r.status === "APPROVED",
  ).length;
  const hoPendingCount = hoRequests.filter(
    (r) => r.status === "HO_PENDING",
  ).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-white">Main Store Manager</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Give final approval on sub store requests · Review and approve HO
          replenishment requests
        </p>
      </div>

      {/* Flow explanation */}
      <div className="mb-4 bg-slate-800/40 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 text-xs">
        <span className="font-semibold text-slate-300">Sub Store Flow: </span>
        Sub Store Staff → Sub Store Manager (1st approval) →{" "}
        <span className="text-cyan-400 font-semibold">
          Main Store Manager — you (final approval)
        </span>{" "}
        → Main Store Fulfills
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Awaiting My Approval (Sub)",
            value: subPendingCount,
            active: subPendingCount > 0,
            activeClass:
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          },
          {
            label: "HO — Awaiting Approval",
            value: hoPendingCount,
            active: hoPendingCount > 0,
            activeClass:
              "bg-purple-500/10 border-purple-500/30 text-purple-400",
          },
          {
            label: "Sub Requests (shown)",
            value: subRequests.length,
            active: false,
          },
          {
            label: "HO Requests (shown)",
            value: hoRequests.length,
            active: false,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-lg p-4 border ${s.active ? s.activeClass : "bg-slate-800/50 border-slate-700"}`}
          >
            <div className="text-slate-400 text-xs uppercase mb-1">
              {s.label}
            </div>
            <div
              className={`font-bold text-2xl font-mono ${s.active ? "" : "text-white"}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-5">
        {[
          {
            id: "substore",
            label: "Sub Store Final Approvals",
            count: subPendingCount,
            countBg: "bg-emerald-500",
          },
          {
            id: "ho",
            label: "HO Request Approvals",
            count: hoPendingCount,
            countBg: "bg-purple-500",
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors
              ${mainTab === t.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`${t.countBg} text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB 1 — Sub Store Final Approvals ═══════════════════════════════ */}
      {mainTab === "substore" && (
        <div>
          {subPendingCount > 0 && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-emerald-400 text-sm font-semibold">
                {subPendingCount} request{subPendingCount > 1 ? "s" : ""}{" "}
                approved by Sub Manager — waiting for your final approval before
                Main Store can fulfill
              </span>
              <button
                onClick={() => setSubFilter("APPROVED")}
                className="text-xs border border-slate-600 text-slate-300 hover:text-white rounded px-3 py-1"
              >
                Show them
              </button>
            </div>
          )}

          <div className="mb-4">
            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending (at Sub Manager)</option>
              <option value="APPROVED">
                Approved by Sub Mgr — Awaiting My Final Approval
              </option>
              <option value="MANAGER_APPROVED">
                Manager Approved — Ready for Main Store to Fulfill
              </option>
              <option value="REJECTED">Rejected</option>
              <option value="FULFILLED">Fulfilled</option>
            </select>
          </div>

          {subLoading ? (
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
                      "From Store",
                      "Requested By",
                      "Sub Mgr Approved By",
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
                  {subRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-slate-500"
                      >
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    subRequests.map((r) => (
                      <tr
                        key={r.request_id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-emerald-400 text-xs font-bold">
                            {r.request_no}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs">
                          {r.from_store_name}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {r.requested_by_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {r.approved_by_name || "—"}
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
                              onClick={() => openSubDetail(r)}
                              className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1"
                            >
                              Details
                            </button>
                            {/* Only act when Sub Mgr has approved (status = APPROVED) */}
                            {r.status === "APPROVED" && (
                              <>
                                <button
                                  onClick={() => openSubApprove(r)}
                                  className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded px-2 py-1"
                                >
                                  Final Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSubRejectModal(r);
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
        </div>
      )}

      {/* ══ TAB 2 — HO Request Approvals ════════════════════════════════════ */}
      {mainTab === "ho" && (
        <div>
          {hoPendingCount > 0 && (
            <div className="mb-4 bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-purple-400 text-sm font-semibold">
                {hoPendingCount} HO request{hoPendingCount > 1 ? "s" : ""} from
                Main Store staff waiting for your approval
              </span>
              <button
                onClick={() => setHoFilter("HO_PENDING")}
                className="text-xs border border-slate-600 text-slate-300 hover:text-white rounded px-3 py-1"
              >
                Show them
              </button>
            </div>
          )}

          <div className="mb-4 bg-slate-800/40 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 text-xs">
            When Main Store staff submit a request to Head Office for
            restocking, it lands here first. You approve it → Head Office sees
            it and fulfills it → Main Store inventory gets updated.
          </div>

          <div className="mb-4">
            <select
              value={hoFilter}
              onChange={(e) => setHoFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="HO_PENDING">
                HO Pending — Awaiting My Approval
              </option>
              <option value="HO_APPROVED">
                HO Approved — Sent to Head Office
              </option>
              <option value="HO_FULFILLED">
                HO Fulfilled — Stock Received
              </option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {hoLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
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
                  {hoRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-slate-500"
                      >
                        No HO requests found.
                      </td>
                    </tr>
                  ) : (
                    hoRequests.map((r) => (
                      <tr
                        key={r.request_id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-purple-400 text-xs font-bold">
                            {r.request_no}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {r.requested_by_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
=======
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
>>>>>>> phase-01
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
<<<<<<< HEAD
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => openHoDetail(r)}
                              className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1"
                            >
                              Details
                            </button>
                            {r.status === "HO_PENDING" && (
                              <>
                                <button
                                  onClick={() => {
                                    setHoApproveModal(r);
                                    setActorName("");
                                  }}
                                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white rounded px-2 py-1"
=======
                          <div className="flex gap-1 items-center">
                            <span
                              className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                            >
                              {isExpanded ? "▲ Hide" : "▼ Details"}
                            </span>
                            {r.status === "PENDING" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setApproveModal(r);
                                    setActorName("");
                                  }}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 ml-1"
>>>>>>> phase-01
                                >
                                  Approve
                                </button>
                                <button
<<<<<<< HEAD
                                  onClick={() => {
                                    setHoRejectModal(r);
                                    setActorName("");
                                    setRejectReason("");
                                  }}
                                  className="text-xs bg-red-600 hover:bg-red-500 text-white rounded px-2 py-1"
=======
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectModal(r);
                                    setActorName("");
                                    setRejectReason("");
                                  }}
                                  className="text-xs bg-red-500 hover:bg-red-400 text-white rounded px-2 py-1"
>>>>>>> phase-01
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
<<<<<<< HEAD
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ MODALS — Sub Store ══════════════════════════════════════════════ */}

      {/* Sub Detail Modal */}
      {subDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSubDetail(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Request — {subDetail.request_no}
              </h2>
              <button
                onClick={() => setSubDetail(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {subDetailLoad ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Status", <StatusBadge status={subDetail.status} />],
                      ["From Store", subDetail.from_store_name],
                      ["Requested By", subDetail.requested_by_name || "—"],
                      [
                        "Sub Mgr Approved By",
                        subDetail.approved_by_name || "—",
                      ],
                      [
                        "Main Mgr Approved By",
                        subDetail.manager_approved_by_name || "—",
                      ],
                      [
                        "Date",
                        new Date(subDetail.requested_at).toLocaleDateString(),
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
                        className={`font-semibold ${subDetail.status !== "PENDING" ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {subDetail.status === "PENDING"
                          ? "⏳ Sub Mgr"
                          : "✓ Sub Mgr"}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span
                        className={`font-semibold ${subDetail.status === "APPROVED" ? "text-amber-400" : subDetail.status === "MANAGER_APPROVED" || subDetail.status === "FULFILLED" ? "text-cyan-400" : "text-slate-600"}`}
                      >
                        {subDetail.status === "APPROVED"
                          ? "⏳ Main Mgr (you)"
                          : subDetail.status === "MANAGER_APPROVED" ||
                              subDetail.status === "FULFILLED"
                            ? "✓ Main Mgr"
                            : "○ Main Mgr"}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span
                        className={`font-semibold ${subDetail.status === "FULFILLED" ? "text-blue-400" : "text-slate-600"}`}
                      >
                        {subDetail.status === "FULFILLED"
                          ? "✓ Fulfilled"
                          : "○ Fulfill"}
                      </span>
                    </div>
                  </div>

                  {subDetail.manager_rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                      <div className="text-red-400 text-xs font-semibold mb-1">
                        REJECTION REASON
                      </div>
                      <div className="text-red-300 text-sm">
                        {subDetail.manager_rejection_reason}
                      </div>
                    </div>
                  )}
                  <ItemsTable items={subDetail.items} />
                  <AuditTrail audit={subDetail.audit} />
                  {subDetail.status === "APPROVED" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                      <button
                        onClick={() => {
                          setSubDetail(null);
                          openSubApprove(subDetail);
                        }}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-4 py-2 rounded"
                      >
                        Give Final Approval
                      </button>
                      <button
                        onClick={() => {
                          setSubDetail(null);
                          setSubRejectModal(subDetail);
                          setActorName("");
                          setRejectReason("");
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {subDetail.status === "MANAGER_APPROVED" && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-blue-300 text-xs">
                      ✓ Final approval granted. Main Store staff can now fulfill
                      this request.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub Final Approve Modal */}
      {subApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSubApproveModal(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Final Approval — {subApproveModal.request_no}
              </h2>
              <button
                onClick={() => setSubApproveModal(null)}
                className="text-slate-400 hover:text-white text-xl"
=======
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
                    </>
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
            onClick={() => setApproveModal(null)}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-bold">
                Approve — {approveModal.request_no}
              </h2>
              <button
                onClick={() => setApproveModal(null)}
                className="text-gray-400 hover:text-gray-700 text-xl"
>>>>>>> phase-01
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
<<<<<<< HEAD
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-3 text-cyan-300 text-xs">
                This is the <strong>final approval</strong>. After this, Main
                Store staff will be able to dispatch the items and mark the
                request as fulfilled.
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
=======
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-700 text-xs">
                Once approved, this request will be visible to{" "}
                <strong>Head Office</strong> who will dispatch the items and
                update Main Store inventory.
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
>>>>>>> phase-01
                  Your Name *
                </label>
                <input
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  placeholder="Main Store Manager name"
<<<<<<< HEAD
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
                  Adjust quantities if needed
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-center pb-2">Requested</th>
                      <th className="text-center pb-2">Sub Mgr Qty</th>
                      <th className="text-center pb-2">Your Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subEditedItems.map((i, idx) => (
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
                        <td className="py-2 font-mono text-slate-500 text-center">
                          {i.requested_qty}
                        </td>
                        <td className="py-2 font-mono text-slate-400 text-center">
                          {i.approved_qty}
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={i.approved_qty}
                            onChange={(e) => {
                              const u = [...subEditedItems];
                              u[idx] = {
                                ...u[idx],
                                approved_qty: +e.target.value,
                              };
                              setSubEditedItems(u);
                            }}
                            className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setSubApproveModal(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded"
=======
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setApproveModal(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
>>>>>>> phase-01
                >
                  Cancel
                </button>
                <button
<<<<<<< HEAD
                  onClick={handleSubApprove}
                  disabled={actioning || !actorName.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
                >
                  {actioning ? "Processing..." : "Give Final Approval"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Reject Modal */}
      {subRejectModal && (
        <RejectModal
          title={`Reject — ${subRejectModal.request_no}`}
          name={actorName}
          setName={setActorName}
          reason={rejectReason}
          setReason={setRejectReason}
          onCancel={() => setSubRejectModal(null)}
          onConfirm={handleSubReject}
          actioning={actioning}
        />
      )}

      {/* ══ MODALS — HO Requests ════════════════════════════════════════════ */}

      {/* HO Detail Modal */}
      {hoDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setHoDetail(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                HO Request — {hoDetail.request_no}
              </h2>
              <button
                onClick={() => setHoDetail(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {hoDetailLoad ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Status", <StatusBadge status={hoDetail.status} />],
                      ["Requested By", hoDetail.requested_by_name || "—"],
                      ["Approved By", hoDetail.manager_approved_by_name || "—"],
                      [
                        "Date",
                        new Date(hoDetail.requested_at).toLocaleDateString(),
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
                  {hoDetail.notes && (
                    <div className="bg-slate-800 rounded p-3">
                      <div className="text-slate-500 text-xs mb-1">NOTES</div>
                      <div className="text-slate-300 text-sm">
                        {hoDetail.notes}
                      </div>
                    </div>
                  )}
                  {hoDetail.manager_rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                      <div className="text-red-400 text-xs font-semibold mb-1">
                        REJECTION REASON
                      </div>
                      <div className="text-red-300 text-sm">
                        {hoDetail.manager_rejection_reason}
                      </div>
                    </div>
                  )}
                  <ItemsTable items={hoDetail.items} />
                  <AuditTrail audit={hoDetail.audit} />
                  {hoDetail.status === "HO_PENDING" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                      <button
                        onClick={() => {
                          setHoDetail(null);
                          setHoApproveModal(hoDetail);
                          setActorName("");
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setHoDetail(null);
                          setHoRejectModal(hoDetail);
                          setActorName("");
                          setRejectReason("");
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded"
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

      {/* HO Approve Modal */}
      {hoApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setHoApproveModal(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold">
                Approve HO Request — {hoApproveModal.request_no}
              </h2>
              <button
                onClick={() => setHoApproveModal(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 text-purple-300 text-xs">
                Once approved, this request will appear on the{" "}
                <strong>Head Office dashboard</strong>. Head Office will
                dispatch the items and your Main Store inventory will be updated
                automatically.
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <input
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  placeholder="Main Store Manager name"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setHoApproveModal(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHoApprove}
                  disabled={actioning || !actorName.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
=======
                  onClick={handleApprove}
                  disabled={actioning || !actorName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
>>>>>>> phase-01
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

<<<<<<< HEAD
      {/* HO Reject Modal */}
      {hoRejectModal && (
        <RejectModal
          title={`Reject HO Request — ${hoRejectModal.request_no}`}
=======
      {/* Reject Modal */}
      {rejectModal && (
        <RejectModal
          title={`Reject — ${rejectModal.request_no}`}
>>>>>>> phase-01
          name={actorName}
          setName={setActorName}
          reason={rejectReason}
          setReason={setRejectReason}
<<<<<<< HEAD
          onCancel={() => setHoRejectModal(null)}
          onConfirm={handleHoReject}
=======
          onCancel={() => setRejectModal(null)}
          onConfirm={handleReject}
>>>>>>> phase-01
          actioning={actioning}
        />
      )}

<<<<<<< HEAD
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
=======
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
          ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
>>>>>>> phase-01
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
