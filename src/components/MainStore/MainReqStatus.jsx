import React, { useState } from "react"; // Added React for Fragment
import { getRequestById, submitGRN } from "../../services/api";
import StatusBadge from "../StatusBadge";
import GRNModal from "../GRNModal";
import useErrorHandler from "../useErrorHandler";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";

// ── Date + time cell ──────────────────────────────────────────────────────────
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

// ── Inline detail panel ───────────────────────────────────────────────────────
const renderInlineDetail = (d, onOpenGRN, grnLoading) => {
  const isDisputed = d.status === "DISPUTED";
  const isReceived = d.status === "RECEIVED";
  const needsGRN = d.status === "FULFILLED" && !d.grn_at;
  const showGRNColumns = isDisputed || isReceived;

  return (
    <div className="space-y-3">
      {showGRNColumns && d.grn_note && (
        <div
          className={`rounded-xl p-3 border text-sm ${
            isDisputed
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-teal-50 border-teal-200 text-teal-700"
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-1">
            {isDisputed ? "⚠ Reported Issues" : "✓ Receipt Confirmed"}
          </div>
          <div>{d.grn_note}</div>
          {d.grn_at && (
            <div className="text-xs opacity-60 mt-1">
              {new Date(d.grn_at).toLocaleString()}
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

      <div>
        <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
          Items
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 text-xs">
              <th className="text-left pb-2 pr-4">چیز نمبر</th>
              <th className="text-left pb-2 pr-4">چیز کا نام</th>
              <th className="text-left pb-2 pr-4">پیمائش کی اکائی</th>
              <th className="text-center pb-2 pr-4">درخواست کردہ</th>
              <th className="text-center pb-2 pr-4">منظور شدہ</th>
              <th className="text-center pb-2 pr-4">مکمل شدہ</th>
              {showGRNColumns && (
                <>
                  <th className="text-center pb-2 pr-4">موصول شدہ</th>
                  <th className="text-center pb-2">حالت</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(d.items || []).map((i) => (
              <tr key={i.request_item_id} className="border-b border-gray-100">
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
                {showGRNColumns && (
                  <>
                    <td className="py-2 pr-4 font-mono text-center">
                      <span
                        className={
                          i.received_qty != null
                            ? Number(i.received_qty) < Number(i.fulfilled_qty)
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
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {needsGRN && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenGRN();
            }}
            disabled={grnLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
          >
            {grnLoading ? "Loading…" : "Verify Delivery"}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function MainReqStatus({ hoRequests, onRefresh, loading, mainStoreError, showToast }) {
  const [hoFilter, setHoFilter] = useState("");
  const [hoDetail, setHoDetail] = useState(null);
  const [hoDetailLoad, setHoDL] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [grnRequest, setGrnRequest] = useState(null);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnSubmitting, setGrnSubmitting] = useState(false);
  
  const handleError = useErrorHandler();

  const openHoDetail = async (r) => {
    if (hoDetail && hoDetail.request_id === r.request_id) {
      setHoDetail(null);
      return;
    }
    setHoDL(true);
    setHoDetail({ ...r, items: [] });
    try {
      const res = await getRequestById(r.request_id);
      setHoDetail(res.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      showToast(msg);
    } finally {
      setHoDL(false);
    }
  };

  const openGRN = async (r) => {
    setGrnLoading(true);
    try {
      const res = await getRequestById(r.request_id);
      setGrnRequest(res.data.data);
    } catch(error) {
      const msg = handleError(error, "Failed to load request details");
      showToast(msg);
    } finally {
      setGrnLoading(false);
    }
  };

  const handleGRNSubmit = async (payload) => {
    setGrnSubmitting(true);
    try {
      await submitGRN(grnRequest.request_id, payload);
      const label =
        payload.grn_status === "RECEIVED"
          ? "Delivery confirmed — marked as RECEIVED"
          : payload.grn_status === "DISPUTED"
          ? "Issues reported — request marked DISPUTED"
          : "Delivery rejected — notified";
      showToast(label, payload.grn_status === "RECEIVED" ? "success" : "warn");
      setGrnRequest(null);
      setHoDetail(null);
      if (onRefresh) onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to submit GRN");
      showToast(msg);
    } finally {
      setGrnSubmitting(false);
    }
  };

  const filtered = hoFilter
    ? hoRequests.filter((r) => r.status === hoFilter)
    : hoRequests;

  const pendingGRN = hoRequests.filter(
    (r) => r.status === "FULFILLED" && !r.grn_at,
  ).length;
  
  const paginatedRequests = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div>
      {/* ── Pending GRN banner ── */}
      {pendingGRN > 0 && (
        <div className="mb-4 flex items-center gap-2 text-xs text-blue-600 font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
          {pendingGRN} deliver{pendingGRN > 1 ? "ies" : "y"} waiting for confirmation
        </div>
      )}

      {/* ── Filter row ── */}
      <div className="flex flex-wrap gap-2 items-end h-full py-2 justify-between">
        <select
          value={hoFilter}
          onChange={(e) => {
            setHoFilter(e.target.value);
            setCurrentPage(1); // Reset to page 1 on filter change
          }}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">تمام حالتیں</option>
          <option value="PENDING">زیر التواء</option>
          <option value="APPROVED">منظور شدہ</option>
          <option value="FULFILLED">مکمل شدہ</option>
          <option value="RECEIVED">موصول شدہ</option>
          <option value="DISPUTED">متنازع</option>
          <option value="REJECTED">مسترد شدہ</option>
        </select>

        <div className="Temp-downloader">
          <ExcelDownloaderWithDates
            dateKey="created_at"
            fileName="requests"
            columns={[
              { key: "request_id", label: "درخواست نمبر" },
              { key: "requested_by_name", label: "درخواست کنندہ" },
              {
                key: "created_at",
                label: "درخواست کی تاریخ",
                format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
              },
              { key: "status", label: "حالت" },
              {
                key: "approved_at",
                label: "منظوری کی تاریخ",
                format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
              },
              {
                key: "fulfilled_at",
                label: "تکمیل کی تاریخ",
                format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
              },
            ]}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "درخواست نمبر",
                "درخواست کنندہ",
                "درخواست کا وقت",
                "حالت",
                "منظوری کا وقت",
                "مکمل ہونے کا وقت",
                "مسترد ہونے کا وقت",
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
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : error || mainStoreError ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                    {error || mainStoreError}
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No requests found.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((r) => {
                const isExpanded = hoDetail && hoDetail.request_id === r.request_id;
                const needsGRN = r.status === "FULFILLED" && !r.grn_at;
                const isDisputed = r.status === "DISPUTED";

                return (
                  <React.Fragment key={r.request_id}>
                    <tr
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        needsGRN
                          ? "bg-blue-50/40 hover:bg-blue-50"
                          : isDisputed
                            ? "bg-amber-50/40 hover:bg-amber-50"
                            : "hover:bg-gray-50"
                      } ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => openHoDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-yellow-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                          {r.item_count > 0 && (
                            <span className="bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                              {r.item_count} item{r.item_count > 1 ? "s" : ""}
                            </span>
                          )}
                          {needsGRN && (
                            <span className="bg-blue-100 text-blue-600 text-xs font-bold rounded px-1.5 py-0.5 border border-blue-200 animate-pulse">
                              ACTION NEEDED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.requested_by_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.created_at} />
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
                        <DateTimeCell ts={r.rejected_at} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {needsGRN && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openGRN(r);
                              }}
                              disabled={grnLoading}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                            >
                              {grnLoading ? "…" : "Verify Delivery"}
                            </button>
                          )}
                          <span className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}>
                            {isExpanded ? "▲ Hide" : "▼ View"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50 border-b-2 border-yellow-200">
                        <td colSpan={8} className="px-6 py-4">
                          {hoDetailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            hoDetail && renderInlineDetail(hoDetail, () => openGRN(r), grnLoading)
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
        <Pagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ── GRN Modal ── */}
      {grnRequest && (
        <GRNModal
          request={grnRequest}
          onClose={() => setGrnRequest(null)}
          onSubmit={handleGRNSubmit}
          submitting={grnSubmitting}
        />
      )}
    </div>
  );
}