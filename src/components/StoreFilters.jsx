import { useState } from "react";
import { ChevronDown } from 'lucide-react';

const pages = {
  subStore: {
    page: "subStore",
    store: true,
  },

  subStoreManager: {
    page: "subStoreManager",
    store: true,
  },

  mainSubStoreReqs: {
    page: "mainSubStoreReqs",
    store: false,
  },
  mainReqToHO: {
    page: "mainReqToHO",
    store: false
  }
}

export default function StoreFilters({
  filterStatus,
  setFilterStatus,
  filterStore,
  setFilterStore,
  role,
  subStores,
  pageType,
  loading,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const currentPage = pages[pageType]

  const categories = [
    { label: "تمام حالتیں", value: "" },
    { label: "زیرِ التواء", value: "PENDING" },
    { label: "منظور شدہ", value: "APPROVED" },
    { label: "مسترد شدہ", value: "REJECTED" },
    { label: "مکمل کیا گیا", value: "FULFILLED" },
    { label: "وصول ہو گیا", value: "RECEIVED" },
    { label: "متنازع", value: "DISPUTED" },
    ...(pageType === "mainSubStoreReqs"
      ? [{ label: "واپس کر دیا گیا", value: "RETURN_BACK" }]
      : [])
  ];

  const selectedLabel = categories.find((c) => c.value === filterStatus)?.label || "تمام حالتیں";

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative">
          <input
            readOnly
            value={selectedLabel}
            disabled={loading}
            onClick={() => setShowDropdown((prev) => !prev)}
            className="bg-white border border-gray-300 rounded px-3 py-1 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
          />
          {showDropdown && (
            <div className="w-max h-max bg-emerald-950 z-49 ">
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setFilterStatus(cat.value)
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>


        {currentPage.store && role === "super admin" && (
          <select
            value={filterStore}
            disabled={loading}
            onChange={(e) => setFilterStore(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-1 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">تمام اسٹورز</option>
            {subStores.map((s) => (
              <option key={s.store_id} value={s.store_id}>
                {s.store_name}
              </option>
            ))}
          </select>
        )}
      </div>

    </>
  );
}
