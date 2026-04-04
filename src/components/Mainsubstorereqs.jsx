import React, { useState } from "react";
import {
  getRequestById,
  fulfillRequest,
  acceptReturn,
  resendItems,
} from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/authContext";

// ── Condition badge ───────────────────────────────────────────────────────────
const ConditionBadge = ({ condition }) => {
  if (!condition || condition === "OK") return null;
  const styles = {
    DAMAGED: "bg-amber-50 border-amber-300 text-amber-700",
    MISSING: "bg-red-50 border-red-300 text-red-700",
  };
  return (
    <span
      className={`px-1.5 py-0.5 rounded border text-xs font-bold font-mono ml-1 ${styles[condition]}`}
    >
      {condition}
    </span>
  );
};

// ── Dispute Resolution Panel ──────────────────────────────────────────────────
const DisputeResolutionPanel = ({ request, onResolved, showToast }) => {
  
const { auth } = useAuth();
  
  const [resolvedBy, setResolvedBy] = useState(auth.username || "");
  const [processing, setProcessing] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const disputedItems = (request.items || []).filter(
    (i) =>
      (i.item_condition && i.item_condition !== "OK") ||
      (i.received_qty != null &&
        Number(i.received_qty) < Number(i.fulfilled_qty)),
  );

  const handleAcceptReturn = async () => {
    if (!resolvedBy.trim()) return showToast("Please enter your name", "error");
    setProcessing("return");
    try {
      await acceptReturn(request.request_id, {
        resolved_by_name: resolvedBy.trim(),
      });
      showToast("Return accepted — stock restored to main store");
      onResolved();
    } catch (e) {
      showToast(
        e.response?.data?.message || "Failed to accept return",
        "error",
      );
    } finally {
      setProcessing(null);
      setConfirmed(null);
    }
  };

  const handleResend = async () => {
    if (!resolvedBy.trim()) return showToast("Please enter your name", "error");
    setProcessing("resend");
    try {
      const res = await resendItems(request.request_id, {
        resolved_by_name: resolvedBy.trim(),
      });
      showToast(
        res.data?.message || "New request created and ready to fulfill",
      );
      onResolved();
    } catch (e) {
      showToast(
        e.response?.data?.message || "Failed to create resend request",
        "error",
      );
    } finally {
      setProcessing(null);
      setConfirmed(null);
    }
  };

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-700 text-sm font-bold">
          Dispute Resolution Required
        </span>
      </div>

      <div className="p-4 space-y-4 bg-white">
        {request.grn_note && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
              Sub Store Says
            </div>
            <div className="text-amber-800 text-sm">{request.grn_note}</div>
            {request.grn_at && (
              <div className="text-amber-400 text-xs mt-1">
                {new Date(request.grn_at).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {disputedItems.length > 0 && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Affected Items
            </div>
            <div className="space-y-1.5">
              {disputedItems.map((i) => {
                const shortfall =
                  Number(i.fulfilled_qty ?? 0) -
                  Number(i.received_qty ?? i.fulfilled_qty ?? 0);
                return (
                  <div
                    key={i.request_item_id}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                  >
                    <span className="font-mono text-emerald-600 text-xs font-bold w-20 shrink-0">
                      {i.item_no}
                    </span>
                    <span className="text-gray-700 text-sm flex-1">
                      {i.item_name}
                    </span>
                    {shortfall > 0 && (
                      <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">
                        {shortfall} {i.item_uom} short
                      </span>
                    )}
                    {i.item_condition && i.item_condition !== "OK" && (
                      <ConditionBadge condition={i.item_condition} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
            Your Name *
          </label>
          <input
            value={resolvedBy}
            readOnly
            onChange={(e) => setResolvedBy(e.target.value)}
            placeholder="Enter your name to proceed"
            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
          />
        </div>

        {confirmed === null ? (
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setConfirmed("return")}
              disabled={!!processing}
              className="flex-1 flex flex-col items-center gap-1 border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl px-4 py-3 transition-all group disabled:opacity-40"
            >
              <span className="text-2xl">↩</span>
              <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700">
                Accept Return
              </span>
              <span className="text-xs text-gray-400 group-hover:text-emerald-500 text-center">
                Add missing qty back to main store stock & close case
              </span>
            </button>

            <button
              onClick={() => setConfirmed("resend")}
              disabled={!!processing}
              className="flex-1 flex flex-col items-center gap-1 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-4 py-3 transition-all group disabled:opacity-40"
            >
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
                Resend Fresh Items
              </span>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 text-center">
                Auto-create new request for missing quantities
              </span>
            </button>
          </div>
        ) : (
          <div
            className={`rounded-xl border-2 p-4 space-y-3 ${
              confirmed === "return"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div
              className={`text-sm font-bold ${
                confirmed === "return" ? "text-emerald-700" : "text-blue-700"
              }`}
            >
              {confirmed === "return"
                ? "Confirm: Accept return and restore stock?"
                : "Confirm: Create a new resend request?"}
            </div>
            <div
              className={`text-xs ${
                confirmed === "return" ? "text-emerald-600" : "text-blue-600"
              }`}
            >
              {confirmed === "return"
                ? "Missing quantities will be added back to main store inventory and this case will be closed."
                : `A new APPROVED request will be created for the ${disputedItems.length} affected item(s). The original dispute will be closed.`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmed(null)}
                disabled={!!processing}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={
                  confirmed === "return" ? handleAcceptReturn : handleResend
                }
                disabled={!!processing}
                className={`flex-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-40 transition-colors ${
                  confirmed === "return"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {processing
                  ? "Processing…"
                  : confirmed === "return"
                    ? "Yes, Accept Return & Close"
                    : "Yes, Create Resend Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Inline detail renderer ────────────────────────────────────────────────────
const renderInlineDetail = (
  d,
  isLoading,
  onFulfill,
  fulfillingId,
  onResolved,
  showToast,
) => {
  const isDisputed = d.status === "DISPUTED";
  const isReceived = d.status === "RECEIVED";
  const isClosed = d.status === "CLOSED";
  const hasGRN = isDisputed || isReceived || isClosed;

  return (
    <div className="space-y-4">
      {isReceived && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
          <div className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
            ✓ Sub Store Confirmed Receipt
          </div>
          {d.grn_note && (
            <div className="text-teal-700 text-sm">{d.grn_note}</div>
          )}
          {d.grn_at && (
            <div className="text-teal-400 text-xs mt-1">
              {new Date(d.grn_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {isClosed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
            Case Closed
          </div>
          <div className="text-gray-600 text-sm">
            Resolution:{" "}
            <span className="font-semibold">
              {d.resolution === "RETURN_ACCEPTED"
                ? "Return accepted — stock restored"
                : d.resolution === "RESENT"
                  ? "Fresh items resent via new request"
                  : d.resolution}
            </span>
          </div>
          {d.resolved_by_name && (
            <div className="text-gray-400 text-xs mt-1">
              By {d.resolved_by_name}
            </div>
          )}
          {d.resolved_at && (
            <div className="text-gray-400 text-xs">
              {new Date(d.resolved_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {d.notes && (
        <div className="bg-white rounded p-3 border border-gray-200">
          <div className="text-gray-400 text-xs mb-1">NOTES</div>
          <div className="text-gray-700 text-sm">{d.notes}</div>
        </div>
      )}

      {d.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="text-red-500 text-xs font-semibold mb-1">
            REJECTION REASON
          </div>
          <div className="text-red-600 text-sm">{d.rejection_reason}</div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-400 text-xs">
            <th className="text-left pb-2 pr-4">Item No</th>
            <th className="text-left pb-2 pr-4">Item Name</th>
            <th className="text-left pb-2 pr-4">UOM</th>
            <th className="text-center pb-2 pr-4">Requested</th>
            <th className="text-center pb-2 pr-4">Approved</th>
            <th className="text-center pb-2 pr-4">Fulfilled</th>
            {hasGRN && (
              <React.Fragment>
                <th className="text-center pb-2 pr-4">Received</th>
                <th className="text-center pb-2">Condition</th>
              </React.Fragment>
            )}
          </tr>
        </thead>
        <tbody>
          {(d.items || []).map((i) => {
            const hasItemIssue =
              (i.item_condition && i.item_condition !== "OK") ||
              (i.received_qty != null &&
                Number(i.received_qty) < Number(i.fulfilled_qty));
            return (
              <tr
                key={i.request_item_id}
                className={`border-b border-gray-100 ${hasItemIssue ? "bg-amber-50/50" : ""}`}
              >
                <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                  {i.item_no}
                </td>
                <td className="py-2 pr-4 text-gray-800">{i.item_name}</td>
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
                <td className="py-2 pr-4 font-mono text-center">
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
                {hasGRN && (
                  <React.Fragment>
                    <td className="py-2 pr-4 font-mono text-center">
                      <span
                        className={
                          i.received_qty != null
                            ? Number(i.received_qty) < Number(i.fulfilled_qty)
                              ? "text-amber-600 font-bold"
                              : "text-teal-600"
                            : "text-gray-300"
                        }
                      >
                        {i.received_qty ?? "—"}
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      {i.item_condition ? (
                        <span
                          className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${
                            i.item_condition === "OK"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : i.item_condition === "DAMAGED"
                                ? "bg-amber-50 border-amber-300 text-amber-700"
                                : "bg-red-50 border-red-300 text-red-700"
                          }`}
                        >
                          {i.item_condition}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </React.Fragment>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Dispute resolution — only for DISPUTED */}
      {isDisputed && (
        <DisputeResolutionPanel
          request={d}
          onResolved={onResolved}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function MainSubStoreReqs({ requests, onRefresh, showToast }) {
  const [reqFilter, setReqFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);

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

  const handleFulfill = async (requestId) => {
    setFulfilling(requestId);
    try {
      await fulfillRequest(requestId);
      showToast("Request fulfilled and inventory updated");
      setDetail(null);
      onRefresh();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fulfill", "error");
    } finally {
      setFulfilling(null);
    }
  };

  const handleResolved = () => {
    setDetail(null);
    onRefresh();
  };

  const filtered = reqFilter
    ? requests.filter((r) => r.status === reqFilter)
    : requests;

  const disputedCount = requests.filter((r) => r.status === "DISPUTED").length;

  return (
    <div>
      {disputedCount > 0 && reqFilter !== "DISPUTED" && (
        <div
          className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setReqFilter("DISPUTED")}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-amber-700 text-sm font-semibold">
            {disputedCount} request{disputedCount > 1 ? "s" : ""} disputed by
            sub store — click to review
          </span>
          <span className="ml-auto text-amber-500 text-xs">View →</span>
        </div>
      )}

      <div className="mb-4">
        <select
          value={reqFilter}
          onChange={(e) => setReqFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="RECEIVED">Received</option>
          <option value="DISPUTED">Disputed</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "Request No",
                "From",
                "To",
                "Requested By",
                "Approved By",
                "Date",
                "Status",
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";
                const isClosed = r.status === "CLOSED";

                return (
                  <React.Fragment>
                    <tr
                      key={r.request_id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        isDisputed
                          ? "bg-amber-50/50 hover:bg-amber-50"
                          : isReceived
                            ? "bg-teal-50/30 hover:bg-teal-50"
                            : isClosed
                              ? "bg-gray-50/50 hover:bg-gray-100"
                              : "hover:bg-gray-50"
                      } ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => openDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.from_store_name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.to_store_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.requested_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.approved_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
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
                          {r.status === "APPROVED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFulfill(r.request_id);
                              }}
                              disabled={fulfilling === r.request_id}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 disabled:opacity-40 ml-1"
                            >
                              {fulfilling === r.request_id ? "..." : "Fulfill"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr
                        key={r.request_id + "-detail"}
                        className={`border-b-2 ${
                          isDisputed
                            ? "bg-amber-50/20 border-amber-300"
                            : isReceived
                              ? "bg-teal-50/20 border-teal-300"
                              : isClosed
                                ? "bg-gray-50 border-gray-300"
                                : "bg-gray-50 border-emerald-200"
                        }`}
                      >
                        <td colSpan={8} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            detail &&
                            renderInlineDetail(
                              detail,
                              detailLoad,
                              handleFulfill,
                              fulfilling,
                              handleResolved,
                              showToast,
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
    </div>
  );
}
