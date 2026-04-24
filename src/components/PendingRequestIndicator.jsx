import React from "react";

const pages = {
  subStore: {
    status: "FULFILLED",
    buttonText: "Show Fulfilled",
    messageType: "approval",
  },

  subStoreManager: {
    status: "PENDING",
    buttonText: "Show Pending",
    messageType: "approval",
  },

  mainSubStoreReqs: {
    status: "APPROVED",
    buttonText: "Show Approved",
    messageType: "approval",
  },
}

const PendingRequestIndicator = ({
  pendingCount,
  setFilterStatus,
  filterStatus,
  pageType,
}) => {

  const currentPage = pages[pageType]

  if(!currentPage || pendingCount <= 0) return null

  return (
    <>
    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
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
    </>
  );
};

export default PendingRequestIndicator;
