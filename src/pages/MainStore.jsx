import { useEffect, useState, useCallback } from "react";
import { getRequests, getStores, getItems } from "../services/api";
import MainAllItems from "../components/MainStore/MainAllItems";
import MainSubStoreReqs from "../components/MainStore/MainSubStoreReqs";
import MainReqStatus from "../components/MainStore/MainReqStatus";
import MainReqToHO from "../components/MainStore/MainReqToHO";
import { useAuth } from "../context/authContext";
import useErrorHandler from "../components/useErrorHandler";
import BlockedUI from "../components/BlockedUI"
import Toast from "../components/Toast";

const TABS = [
  { id: "items", label: "تمام اشیاء" },
  { id: "requests", label: "تمام اسٹورز کی درخواستیں" },
  { id: "ho-status", label: "مرکزی دفتر کی درخواستوں کی حالت" },
  { id: "ho-create", label: "نئی مرکزی دفتر کی درخواست" },
];

export default function MainStore() {
  const [tab, setTab] = useState("items");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [requests, setRequests]     = useState([]);
  const [allItems, setAllItems]     = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [hoRequests, setHoRequests] = useState([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [mainStoreError, setMainStoreError]     = useState("");
  const [toast, setToast]     = useState(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // ── Auth And Error ──────────────────────────────────────────────────────────
  
  const { auth } = useAuth()
  
  const handleError = useErrorHandler()
  
  // ── Fetch data (silent = no spinner, used for refreshes) ────────────────── 

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rRes, sRes, iRes, hoReqRes] = await Promise.all([
        getRequests({ direction: "SUB_TO_MAIN" }),
        getStores(),
        getItems(),
        getRequests({ direction: "MAIN_TO_HO" }),
      ]);

      setRequests(rRes.data.data);
      setHoRequests(hoReqRes.data.data);
      setAllItems(iRes.data.data);

      const allStores = sRes.data.data;
      setMainStores(allStores.filter((s) => s.store_type === "MAIN_STORE"));
      setHeadOffices(allStores.filter((s) => s.store_type === "HEAD_OFFICE"));
    } catch(error) {
      const msg = handleError(error, "Failed to load data")
      setMainStoreError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load — show spinner
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Silent refresh — no spinner, no flicker
  const refresh = useCallback(() => fetchData(true), [fetchData]);

  // ── Badge counts ──────────────────────────────────────────────────────────
  const pendingApproved = requests.filter((r) => r.status === "APPROVED").length;
  const pendingHo       = hoRequests.filter((r) => r.status === "PENDING").length;

  
  
  if (auth.isBlocked) {
    return <BlockedUI message={auth.message}/>
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Main Store</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage sub store requests, track inventory flow, and request from Head Office
        </p>
      </div>

      {/* Tab navigation */}
      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center gap-1 flex-wrap shadow-sm">
        {TABS.map((t) => {
          const badge =
            t.id === "requests"  && pendingApproved > 0 ? pendingApproved :
            t.id === "ho-status" && pendingHo > 0       ? pendingHo       : null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${tab === t.id ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
            >
              {t.label}
              {badge && (
                <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none
                  ${tab === t.id ? "bg-white/20 text-white" : "bg-emerald-600 text-white"}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
      {tab === "items" && (
        <MainAllItems
          allItems={allItems}
          mainStores={mainStores}
          onRefresh={refresh}
          showToast={showToast}
          loading={loading}
          mainStoreError={mainStoreError}
        />
      )}

      {tab === "requests" && (
        <MainSubStoreReqs
          requests={requests}
          onRefresh={refresh}
          showToast={showToast}
          loading={loading}
          mainStoreError={mainStoreError}
        />
      )}

      {tab === "ho-status" && (
        <MainReqStatus
          hoRequests={hoRequests}
          showToast={showToast}
          onRefresh={refresh}
          loading={loading}
          mainStoreError={mainStoreError}
        />
      )}

      {tab === "ho-create" && (
        <MainReqToHO
          mainStores={mainStores}
          headOffices={headOffices}
          hoRequests={hoRequests}   
          refresh={refresh}
          showToast={showToast}
          loading={loading}
          mainStoreError={mainStoreError}
        />
      )}

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}