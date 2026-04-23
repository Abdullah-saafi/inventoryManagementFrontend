import React from "react";

const PendingRequestIndicator = ({
  pendingCount,
  setFilterStatus,
  filterStatus,
  pageType,
}) => {
  return (
    <>
      <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="text-yellow-700 text-sm font-semibold" dir="rtl">
          {pendingCount} {pendingCount > 1 ? "درخواستیں" : "درخواست"} آپ کی
          منظوری کی منتظر {pendingCount > 1 ? "ہیں" : "ہے"}
        </span>
        <button
          onClick={() =>
            setFilterStatus(
              pageType === "subStore"
                ? "FULFILLED"
                : pageType === "mainSubStoreReqs"
                  ? "APPROVED"
                  : "PENDING",
            )
          }
          className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1"
        >
          Show Pending .
        </button>
      </div>
      {/* {disputedCount > 0(
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
    )} */}
    </>
  );
};

export default PendingRequestIndicator;
