import { useEffect, useState } from "react";
import { getRequests, getRequestById } from "../services/api";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";
import API from "../services/api";

const fulfillRequest = (id, data) => API.patch(`/requests/${id}/fulfill`, data);

// ── Status badge ──────────────────────────────────────────────────────────────
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
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
        styles[status] || "bg-gray-50 text-gray-500 border border-gray-200"
      }`}
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

export default function HeadOffice() {
  const { auth } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);

  // Shared modal for first fulfill AND re-dispatch on dispute
  const [fulfillModal, setFulfillModal] = useState(null);
  const [fulfillMode, setFulfillMode] = useState("fulfill"); // "fulfill" | "refulfill"
  const [fulfilledItems, setFulfilledItems] = useState([]);
  const [fulfillerName, setFulfillerName] = useState("");
  const [fulfillNotes, setFulfillNotes] = useState("");
  const [actioning, setActioning] = useState(false);

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

  // mode = "fulfill" for first dispatch, "refulfill" for re-dispatch after dispute
  const openFulfill = async (r, mode = "fulfill") => {
    try {
      const res = await getRequestById(r.request_id);
      setFulfilledItems(
        (res.data.data.items || []).map((i) => ({
          ...i,
          fulfilled_qty: i.approved_qty ?? i.requested_qty,
        })),
      );
      setFulfillModal(res.data.data); // store full detail so we have grn_note
      setFulfillMode(mode);
      setFulfillerName(auth.username || "");
      setFulfillNotes("");
    } catch {
      setToast({ message: "Failed to load items", type: "error" });
    }
  };

  const handleFulfill = async () => {
    if (!fulfillerName.trim()) return;
    if (fulfillMode === "refulfill" && !fulfillNotes.trim()) return;
    setActioning(true);
    try {
      await fulfillRequest(fulfillModal.request_id, {
        fulfilled_by_name: fulfillerName,
        notes: fulfillNotes,
        fulfilled_items: fulfilledItems.map((i) => ({
          request_item_id: i.request_item_id,
          fulfilled_qty: i.fulfilled_qty,
        })),
      });
      setToast({
        message:
          fulfillMode === "refulfill"
            ? "Re-dispatched — Main Store will verify the corrected delivery"
            : "Request fulfilled — Main Store will verify delivery",
        type: "success",
      });
      setFulfillModal(null);
      setFulfillerName("");
      setFulfillNotes("");
      setFulfilledItems([]);
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Error fulfilling request",
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

  const pendingFulfill = requests.filter((r) => r.status === "APPROVED").length;
  const disputedCount = requests.filter((r) => r.status === "DISPUTED").length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Head Office — fulfill approved Main Store requests
          </p>
        </div>
      </div>

      {/* ── Alert banners ── */}
      {pendingFulfill > 0 && (
        <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-emerald-700 text-sm font-semibold">
            {pendingFulfill} approved request{pendingFulfill > 1 ? "s" : ""}{" "}
            ready to fulfill
          </span>
          <button
            onClick={() => setFilter("APPROVED")}
            className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1"
          >
            Show Approved
          </button>
        </div>
      )}

      {disputedCount > 0 && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
            <span className="text-amber-700 text-sm font-semibold">
              {disputedCount} disputed deliver{disputedCount > 1 ? "ies" : "y"}{" "}
              — Main Store reported issues, re-dispatch required
            </span>
          </div>
          <button
            onClick={() => setFilter("DISPUTED")}
            className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1"
          >
            Show Disputed
          </button>
        </div>
      )}

      {/* ── Filter ── */}
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

      {/* ── Table ── */}
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
                const canFulfill = r.status === "APPROVED";
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";

                return (
                  <>
                    <tr
                      key={r.request_id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        canFulfill
                          ? "bg-emerald-50/30 hover:bg-emerald-50"
                          : isDisputed
                            ? "bg-amber-50/40 hover:bg-amber-50"
                            : "hover:bg-gray-50"
                      } ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => openDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                          {r.item_count > 0 && (
                            <span className="bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                              {r.item_count} item{r.item_count > 1 ? "s" : ""}
                            </span>
                          )}
                          {canFulfill && (
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold rounded px-1.5 py-0.5 border border-emerald-200 animate-pulse">
                              READY
                            </span>
                          )}
                          {isDisputed && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold rounded px-1.5 py-0.5 border border-amber-200 animate-pulse">
                              ACTION NEEDED
                            </span>
                          )}
                        </div>
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
                          {canFulfill && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openFulfill(r, "fulfill");
                              }}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 ml-1 font-semibold"
                            >
                              Fulfill
                            </button>
                          )}
                          {isDisputed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openFulfill(r, "refulfill");
                              }}
                              className="text-xs bg-amber-500 hover:bg-amber-400 text-white rounded px-2 py-1 ml-1 font-semibold"
                            >
                              Re-dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
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

                                {/* GRN note from Main Store — dispute or receipt */}
                                {(isDisputed || isReceived) &&
                                  detail.grn_note && (
                                    <div
                                      className={`rounded-xl p-3 border text-sm ${
                                        isDisputed
                                          ? "bg-amber-50 border-amber-200 text-amber-700"
                                          : "bg-teal-50 border-teal-200 text-teal-700"
                                      }`}
                                    >
                                      <div className="text-xs font-bold uppercase tracking-wider mb-1">
                                        {isDisputed
                                          ? "⚠ Main Store Reported Issues — Re-dispatch Required"
                                          : "✓ Main Store Confirmed Receipt"}
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
                                        <th className="text-center pb-2 pr-4">
                                          Fulfilled
                                        </th>
                                        {(isDisputed || isReceived) && (
                                          <>
                                            <th className="text-center pb-2 pr-4">
                                              Received
                                            </th>
                                            <th className="text-center pb-2">
                                              Condition
                                            </th>
                                          </>
                                        )}
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
                                          {(isDisputed || isReceived) && (
                                            <>
                                              <td className="py-2 pr-4 font-mono text-center">
                                                <span
                                                  className={
                                                    i.received_qty != null
                                                      ? Number(i.received_qty) <
                                                        Number(i.fulfilled_qty)
                                                        ? "text-amber-600"
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
                                                        : i.item_condition ===
                                                            "DAMAGED"
                                                          ? "bg-amber-50 border-amber-300 text-amber-700"
                                                          : "bg-red-50 border-red-300 text-red-700"
                                                    }`}
                                                  >
                                                    {i.item_condition}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-300">
                                                    —
                                                  </span>
                                                )}
                                              </td>
                                            </>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Action buttons inside expanded row */}
                                {canFulfill && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <button
                                      onClick={() => {
                                        setDetail(null);
                                        openFulfill(detail, "fulfill");
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded"
                                    >
                                      Fulfill This Request
                                    </button>
                                  </div>
                                )}

                                {isDisputed && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <button
                                      onClick={() => {
                                        setDetail(null);
                                        openFulfill(detail, "refulfill");
                                      }}
                                      className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded"
                                    >
                                      Re-dispatch Corrected Items
                                    </button>
                                  </div>
                                )}

                                {detail.status === "FULFILLED" && (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-700 text-xs">
                                    ✓ Fulfilled — waiting for Main Store to
                                    verify delivery.
                                  </div>
                                )}

                                {detail.status === "RECEIVED" && (
                                  <div className="bg-teal-50 border border-teal-200 rounded p-3 text-teal-700 text-xs">
                                    ✓ Main Store confirmed receipt. This request
                                    is complete.
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

      {/* ── Fulfill / Re-dispatch Modal ── */}
      {fulfillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setFulfillModal(null)}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-bold">
                {fulfillMode === "refulfill" ? "Re-dispatch" : "Fulfill"} —{" "}
                {fulfillModal.request_no}
              </h2>
              <button
                onClick={() => setFulfillModal(null)}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Context banner */}
              {fulfillMode === "refulfill" ? (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-700 text-xs space-y-1">
                  <div className="font-bold">
                    ⚠ Responding to dispute from Main Store
                  </div>
                  <div>
                    Review the reported issues and re-dispatch corrected
                    quantities. Main Store will verify again.
                  </div>
                  {fulfillModal.grn_note && (
                    <div className="mt-2 pt-2 border-t border-amber-200 italic">
                      Main Store said: "{fulfillModal.grn_note}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-700 text-xs">
                  Dispatch items to <strong>Main Store</strong>. Adjust
                  quantities if needed. Main Store will verify receipt.
                </div>
              )}

              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  {fulfillMode === "refulfill"
                    ? "Re-dispatched By"
                    : "Fulfilled By"}{" "}
                  *
                </label>
                <input
                  value={fulfillerName}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-600 text-sm cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
                  {fulfillMode === "refulfill"
                    ? "Corrected dispatch quantities"
                    : "Dispatch quantities"}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 text-xs">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-center pb-2">Approved</th>
                      <th className="text-center pb-2">
                        {fulfillMode === "refulfill"
                          ? "Re-dispatch Qty"
                          : "Fulfill Qty"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fulfilledItems.map((i, idx) => (
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
                          {fulfillMode === "refulfill" &&
                            i.received_qty != null && (
                              <div className="text-amber-600 text-xs mt-0.5">
                                Previously received: {i.received_qty}
                                {i.item_condition &&
                                  i.item_condition !== "OK" && (
                                    <span className="ml-1">
                                      · {i.item_condition}
                                    </span>
                                  )}
                              </div>
                            )}
                        </td>
                        <td className="py-2 font-mono text-emerald-600 text-center">
                          {i.approved_qty ?? i.requested_qty}
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={i.fulfilled_qty}
                            onChange={(e) => {
                              const u = [...fulfilledItems];
                              u[idx] = {
                                ...u[idx],
                                fulfilled_qty: +e.target.value,
                              };
                              setFulfilledItems(u);
                            }}
                            className={`w-20 border rounded px-2 py-1 text-gray-800 text-sm text-center focus:outline-none ${
                              fulfillMode === "refulfill"
                                ? "bg-amber-50 border-amber-300 focus:border-amber-500"
                                : "bg-gray-50 border-gray-300 focus:border-emerald-500"
                            }`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  {fulfillMode === "refulfill"
                    ? "Resolution Notes *"
                    : "Notes (optional)"}
                </label>
                <textarea
                  value={fulfillNotes}
                  onChange={(e) => setFulfillNotes(e.target.value)}
                  rows={2}
                  placeholder={
                    fulfillMode === "refulfill"
                      ? "Explain what was corrected and what is being re-dispatched…"
                      : "Any dispatch notes…"
                  }
                  className={`w-full border rounded px-3 py-2 text-gray-800 text-sm focus:outline-none resize-none ${
                    fulfillMode === "refulfill"
                      ? "bg-white border-amber-300 focus:border-amber-400"
                      : "bg-white border-gray-300 focus:border-emerald-500"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setFulfillModal(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFulfill}
                  disabled={
                    actioning ||
                    !fulfillerName.trim() ||
                    (fulfillMode === "refulfill" && !fulfillNotes.trim())
                  }
                  className={`text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40 ${
                    fulfillMode === "refulfill"
                      ? "bg-amber-500 hover:bg-amber-400"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
                >
                  {actioning
                    ? "Processing..."
                    : fulfillMode === "refulfill"
                      ? "Confirm Re-dispatch"
                      : "Confirm Fulfill"}
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
