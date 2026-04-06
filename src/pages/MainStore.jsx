import { useEffect, useState, useCallback } from "react";
import { getRequests, getStores, getItems } from "../services/api";
import MainAllItems from "../components/Mainallitems";
import MainSubStoreReqs from "../components/Mainsubstorereqs";
import MainReqStatus from "../components/Mainreqstatus";
import MainReqToHO from "../components/Mainreqtoho";

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
  const [error, setError]     = useState("");
  const [toast, setToast]     = useState(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    } catch {
      setError("Failed to load data");
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

  // ── Early returns ─────────────────────────────────────────────────────────
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
        />
      )}

      {tab === "requests" && (
        <MainSubStoreReqs
          requests={requests}
          onRefresh={refresh}
          showToast={showToast}
        />
      )}

      {tab === "ho-status" && (
        <MainReqStatus
          hoRequests={hoRequests}
          onRefresh={refresh}
        />
      )}

      {tab === "ho-create" && (
        <MainReqToHO
          mainStores={mainStores}
          headOffices={headOffices}
          onSubmitted={() => {
            setTab("ho-status");
            refresh();
          }}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
          ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : toast.type === "error"   ? "bg-red-50 border-red-200 text-red-700"
          : "bg-blue-50 border-blue-200 text-blue-700"}`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}
    </div>
  );
}