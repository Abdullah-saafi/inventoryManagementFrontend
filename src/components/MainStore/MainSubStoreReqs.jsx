import { useState } from "react";
import {
  getRequestById,
  fulfillRequest,
  acceptReturn,
  resendItems,
} from "../../services/api";
import StatusBadge from "../StatusBadge";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import React from "react";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import DateTimeCell from "../DateTimeCell";
import DisputeResolutionPanel from "../DisputeResolutionPanel"
import RenderInlineDetail from "../RenderInlineDetail"
import PendingRequestIndicator from "../PendingRequestIndicator";

// ── Main component ────────────────────────────────────────────────────────────
export default function MainSubStoreReqs({
  requests,
  onRefresh,
  setToast,
  loading,
  mainStoreError,
}) {
  const [reqFilter, setReqFilter] = useState("APPROVED");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { auth } = useAuth();
  const handleError = useErrorHandler();
  const pageType = "mainSubStoreReqs"

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
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setToast({message: msg, type:"error"});
    } finally {
      setDL(false);
    }
  };

  const handleFulfill = async (requestId, status) => {
    setFulfilling(requestId);
    try {
      if (status === "DISPUTED") {
        setToast({message: "Cannot fulfill — dispute resolution required",type:"error"});
        return;
      }
      await fulfillRequest(requestId);
      setToast({message: "Request fulfilled and inventory updated", type: "success"});
      setDetail(null);
      onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to fulfill");
      setToast({message: msg, type:"error"});
    } finally {
      setFulfilling(null);
    }
  };

  const handleResolved = () => {
    setDetail(null);
    onRefresh();
  };

  const filtered = Array.isArray(requests)
    ? reqFilter
      ? requests.filter((r) => r.status === reqFilter)
      : requests
    : [];


  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = (filtered || []).slice(
    startIndex,
    startIndex + pageSize,
  );

  const disputedCount = requests.filter((r) => r.status === "DISPUTED").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;

  // Count emergency requests that are APPROVED (waiting to be fulfilled)
  const emergencyCount = requests.filter(
    (r) => r.is_emergency && r.status === "APPROVED",
  ).length;

  const COL_COUNT = 10;

  return (
    <div>

      <PendingRequestIndicator pendingCount={approvedCount} setFilterStatus={setReqFilter}  pageType={pageType}/>
      
      {disputedCount > 0 && reqFilter !== "DISPUTED" && (
        <div
          className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => {
            setReqFilter("DISPUTED");
            setCurrentPage(1);
          }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-amber-700 text-sm font-semibold" dir="rtl">
            {disputedCount} {disputedCount > 1 ? "درخواستیں" : "درخواست"} ذیلی
            اسٹور کی جانب سے متنازع ہیں — جائزہ لینے کے لیے کلک کریں
          </span>
          <span className="ml-auto text-amber-500 text-xs">View →</span>
        </div>
      )}

      {/* <PendingRequestIndicator pendingCount={disputedCount} filterStatus={reqFilter}  pageType={pageType}/> */}


      {/* Emergency alert banner */}
      {emergencyCount > 0 && reqFilter !== "APPROVED" && (
        <div
          className="mb-4 flex items-center gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-red-100 transition-colors animate-pulse"
          onClick={() => {
            setReqFilter("APPROVED");
            setCurrentPage(1);
          }}
        >
          <span className="text-lg">🚨</span>
          <span className="text-red-700 text-sm font-semibold" dir="rtl">
            {emergencyCount} ہنگامی{" "}
            {emergencyCount > 1 ? "درخواستیں" : "درخواست"} فوری توجہ کی ضرورت ہے
          </span>
          <span className="ml-auto text-red-500 text-xs font-bold">
            فوری دیکھیں →
          </span>
        </div>
      )}

      <div className="flex h-full py-2 items-end justify-between">
        <select
          value={reqFilter}
          onChange={(e) => {
            setReqFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">تمام حالتیں</option>
          <option value="PENDING">زیر التواء</option>
          <option value="APPROVED">منظور شدہ</option>
          <option value="REJECTED">مسترد شدہ</option>
          <option value="FULFILLED">مکمل شدہ</option>
          <option value="RECEIVED">وصول شدہ</option>
          <option value="DISPUTED">متنازع</option>
          <option value="CLOSED">بند شدہ</option>
        </select>

        <div className="Temp-downloader">
          <div className="downloader">
            <ExcelDownloaderWithDates
              data={requests}
              dateKey="created_at"
              fileName={auth.username}
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
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "درخواست نمبر",
                "اسٹور سے",
                " مرکزی اسٹور کو   ",
                "درخواست کنندہ",
                "منظور کنندہ",
                "مکمل کرنے والا",
                "درخواست کی تاریخ",
                "تکمیل کی تاریخ",
                "حالت",
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
            {loading || fulfilling ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : mainStoreError ? (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                    {mainStoreError}
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={COL_COUNT}
                  className="text-center py-12 text-gray-400"
                >
                  No requests found.
                </td>
              </tr>
            ) : (
              paginatedData.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";
                const isClosed = r.status === "CLOSED";
                const isEmergency = r.is_emergency;

                return (
                  <React.Fragment key={r.request_id}>
                    <tr
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        isEmergency && r.status === "APPROVED"
                          ? "bg-red-50/60 hover:bg-red-50"
                          : isDisputed
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-emerald-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                          {/* Emergency badge */}
                          {isEmergency && (
                            <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 border border-red-700 animate-pulse">
                              Urgent
                            </span>
                          )}
                          {isDisputed && (
                            <span className="bg-amber-100 text-amber-600 text-xs font-bold rounded px-1.5 py-0.5 border border-amber-200">
                              ACTION NEEDED
                            </span>
                          )}
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
                      <td className="px-4 py-3 text-gray-500">
                        {r.fulfilled_by_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.created_at} />
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.fulfilled_at} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <span
                            className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                          >
                            {isExpanded ? "▲ Hide" : "▼ View"}
                          </span>
                          {r.status === "APPROVED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFulfill(r.request_id);
                              }}
                              className={`text-white text-sm font-semibold px-2.5 ml-2 py-1.5 rounded disabled:opacity-40 ${
                                isEmergency
                                  ? "bg-red-600 hover:bg-red-500"
                                  : "bg-blue-600 hover:bg-blue-500"
                              }`}
                              disabled={fulfilling === r.request_id}
                            >
                              {fulfilling === r.request_id ? "..." : "Fulfill"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr
                        className={`border-b-2 ${
                          isEmergency && r.status === "APPROVED"
                            ? "bg-red-50/20 border-red-300"
                            : isDisputed
                              ? "bg-amber-50/20 border-amber-300"
                              : isReceived
                                ? "bg-teal-50/20 border-teal-300"
                                : isClosed
                                  ? "bg-gray-50 border-gray-300"
                                  : "bg-gray-50 border-emerald-200"
                        }`}
                      >
                        <td colSpan={COL_COUNT} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            detail &&
                            RenderInlineDetail(
                              detail,
                              detailLoad,
                              handleFulfill,
                              fulfilling,
                              handleResolved,
                              setToast,
                              auth.username,
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

      {/* Main Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={filtered?.length || 0}
          pageSize={pageSize || 10}
          onPageChange={setCurrentPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
