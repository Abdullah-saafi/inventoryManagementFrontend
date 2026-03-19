import { useEffect, useState } from "react";
import { getStores } from "../services/api";
import { TABS } from "../services/constants.js";
import AddUserTab from "../components/AddUserTab";
import AddStoreTab from "../components/AddStoreTab";
import AllUsersTab from "../components/AllUsersTab";
import AllStoresTab from "../components/AllStoresTab";
import Toast from "../components/Toast";

export default function Admin() {
  const [tab, setTab] = useState("user");
  const [stores, setStores] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStores = () =>
    getStores({ all: true })
      .then((r) => setStores(r.data.data || []))
      .catch(() => {});

  useEffect(() => {
    loadStores();
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage users, stores and branches
        </p>
      </div>

      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center gap-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${tab === t.id
                ? "bg-emerald-600 text-white"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "user" && (
        <AddUserTab
          stores={stores}
          showToast={showToast}
          onUserCreated={() => {}}
        />
      )}

      {tab === "store" && (
        <AddStoreTab
          showToast={showToast}
          onStoreCreated={loadStores}
        />
      )}

      {tab === "all-users" && (
        <AllUsersTab/>
      )}

      {tab === "all-stores" && (
        <AllStoresTab
          onRefresh={loadStores}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}