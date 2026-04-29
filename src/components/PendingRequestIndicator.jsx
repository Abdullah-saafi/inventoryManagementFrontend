import React from "react";

const PendingRequestIndicator = ({
  pendingCount,
  setFilterStatus,
  filterStatus,
  disputedCount,
  pageType,
  emergencyCount,
  pendingType,
}) => {

  const pages = {
    subStore: {
      status: pendingType === "Return" ? "RECEIVED" : "FULFILLED",
      buttonText: pendingType === "Return" ? "Show Return" : "Show Fulfilled",
      urduMessage: pendingType === "Return" ? `${pendingCount} ${pendingCount > 1 ? "اشیاء" : "آئٹم"} آپ کی طرف سے واپسی کی منتظر ${pendingCount > 1 ? "ہیں" : "ہے"}۔` : `${pendingCount} ${pendingCount > 1 ? "درخواستیں" : "درخواست"} آپ کی
            منظوری کی منتظر ${pendingCount > 1 ? "ہیں" : "ہے"}`
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

  const currentPage = pages[pageType]

  if (!currentPage || pendingCount <= 0) return null

  return (
    <>
      <div className={`mb-4 rounded-lg px-4 py-3 flex border items-center transition-colors justify-between ${pendingType === "Return"
        ? "bg-yellow-50 border-yellow-200 hover:bg-orange-100" :
        "bg-blue-50 border-blue-200 hover:bg-blue-100"

        }`}>
        <span className={`text-sm font-semibold ${pendingType === "Return" ? "text-yellow-700" : "text-blue-700"}`} dir="rtl">
          {currentPage.urduMessage}
        </span>
        <button
          onClick={() => {
            setFilterStatus(currentPage.status)
          }}
          className={`text-xs font-bold border rounded px-3 py-1.5 transition-all ${pendingType === "Return"
            ? "bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-500 hover:text-white" :
            "bg-white border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white"
            }`}
        >
          {currentPage.buttonText}
        </button>
      </div>

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
