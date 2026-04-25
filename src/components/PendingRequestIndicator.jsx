import React from "react";

const pages = {
  subStore: {
    status: "FULFILLED",
    buttonText: "Show Fulfilled",
  },

  subStoreManager: {
    status: "PENDING",
    buttonText: "Show Pending",
  },

  mainSubStoreReqs: {
    status: "APPROVED",
    buttonText: "Show Approved",
  },
  mainReqToHO: {
    status: "FULFILLED",
    buttonText: "Show Fulfilled"
  }
}

const PendingRequestIndicator = ({
  pendingCount,
  setFilterStatus,
  filterStatus,
  disputedCount,
  pageType,
  emergencyCount,
}) => {

  const currentPage = pages[pageType]

  if (!currentPage || pendingCount <= 0) return null

  return (
    <>
      {pendingCount > 0 && filterStatus !== currentPage.status && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center hover:bg-orange-100 transition-colors justify-between">
          <span className="text-yellow-700 text-sm font-semibold" dir="rtl">
            {pendingCount} {pendingCount > 1 ? "درخواستیں" : "درخواست"} آپ کی
            منظوری کی منتظر {pendingCount > 1 ? "ہیں" : "ہے"}
          </span>
          <button
            onClick={() => {
              setFilterStatus(currentPage.status)
            }}
            className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1"
          >
            {currentPage.buttonText}
          </button>
        </div>
      )}

      {pageType === "mainSubStoreReqs" && disputedCount > 0 && filterStatus !== "DISPUTED" && (
        <div className="mb-4 flex items-center gap-3 bg-orange-100 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-200 transition-colors justify-between">
          <span className="text-amber-700 text-sm font-semibold" dir="rtl">
            {disputedCount} {disputedCount > 1 ? "درخواستیں" : "درخواست"} ذیلی
            اسٹور کی جانب سے متنازع ہیں — جائزہ لینے کے لیے کلک کریں
          </span>
          <button
            onClick={() => {
              setFilterStatus("DISPUTED")

            }}
            className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1"
          >
            Show Disputed
          </button>
        </div>
      )}

      {pageType === "mainSubStoreReqs" && emergencyCount > 0 && filterStatus !== "APPROVED" && (
        <div
          className="mb-4 flex items-center gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-red-100 transition-colors"
        >
          <span className="text-red-700 text-sm font-semibold" dir="rtl">
            {emergencyCount} ہنگامی{" "}
            {emergencyCount > 1 ? "درخواستیں" : "درخواست"} فوری توجہ کی ضرورت ہے
          </span>
          <button
            onClick={() => {
              setFilterStatus("APPROVED");
            }}
            className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1 ml-auto"
          >
            فوری دیکھیں →
          </button>
        </div>
      )}

    </>
  );
};

export default PendingRequestIndicator;
