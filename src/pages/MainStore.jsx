import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  getStores,
  createStore,
} from "../services/api";

export default function MainStore() {
  const [requests, setRequests] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("requests");

  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);

  const [showStoreForm, setShowStoreForm] = useState(false);
  const [storeForm, setStoreForm] = useState({
    store_code: "",
    store_name: "",
    address: "",
    phone: "",
  });
  const [savingStore, setSavingStore] = useState(false);

  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "SUB_STORE_STAFF",
    store_id: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        getRequests({ direction: "SUB_TO_MAIN", status: "FULFILLED" }),
        getStores(),
      ]);
      setRequests(rRes.data.data);
      setStores(sRes.data.data.filter((s) => s.store_type === "SUB_STORE"));
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = async (r) => {
    setDL(true);
    setDetail({ ...r, items: [] });
    try {
      const res = await getRequestById(r.request_id);
      setDetail(res.data.data);
    } catch {
    } finally {
      setDL(false);
    }
  };

  const handleAddStore = async () => {
    if (!storeForm.store_code || !storeForm.store_name) return;
    setSavingStore(true);
    try {
      await createStore({ ...storeForm, store_type: "SUB_STORE" });
      setToast({ message: "Sub Store added successfully", type: "success" });
      setShowStoreForm(false);
      setStoreForm({ store_code: "", store_name: "", address: "", phone: "" });
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Failed to add store",
        type: "error",
      });
    } finally {
      setSavingStore(false);
    }
  };

  const statusClass = (status) => {
    const map = {
      PENDING: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      APPROVED:
        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      REJECTED: "bg-red-500/20 text-red-400 border border-red-500/30",
      FULFILLED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    };
    return map[status] || "bg-slate-700 text-slate-400";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
        ⚠ {error}
      </div>
    );

  const tabs = [
    { id: "requests", label: "Approved Requests" },
    { id: "stores", label: "Sub Stores" },
    { id: "users", label: "Add User" },
  ];

  return (
    <div className="p-4">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Main Store
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            View approved sub store requests, manage sub stores and users
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Requests */}
      {tab === "requests" && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                {[
                  "Request No",
                  "From",
                  "To",
                  "Approved By",
                  "Date",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No fulfilled requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr
                    key={r.request_id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs font-bold text-emerald-400">
                      {r.request_no}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.from_store_name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.to_store_name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.approved_by_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider ${statusClass(r.status)}`}
                    >
                      {r.status}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(r)}
                        className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Sub Stores */}
      {tab === "stores" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowStoreForm(true)}
              className="px-4 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Add Sub Store
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  {["Code", "Name", "Address", "Phone", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10 text-slate-500"
                    >
                      No sub stores found.
                    </td>
                  </tr>
                ) : (
                  stores.map((s) => (
                    <tr
                      key={s.store_id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs text-emerald-400">
                        {s.store_code}
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">
                        {s.store_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {s.address || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {s.phone || "—"}
                      </td>
                      <td
                        className={`px-2 py-0.5 text-xs font-semibold ${s.is_active ? "text-emerald-400" : "text-slate-500"}`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {tab === "users" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowUserForm(true)}
              className="px-4 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Add User
            </button>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm mb-1">
              User management requires a users API endpoint.
            </p>
            <p className="text-slate-500 text-xs">
              Once your backend has{" "}
              <span className="font-mono text-slate-400">/api/users</span> CRUD,
              this tab will show a full user list.
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDetail(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold text-base">
                Request — {detail.request_no}
              </h2>
              <button
                onClick={() => setDetail(null)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-3">
              {detailLoad ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Status", detail.status],
                      ["From", detail.from_store_name],
                      ["To", detail.to_store_name],
                      ["Requested By", detail.requested_by_name || "—"],
                      ["Approved By", detail.approved_by_name || "—"],
                      [
                        "Date",
                        new Date(detail.requested_at).toLocaleDateString(),
                      ],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-slate-800 rounded p-2">
                        <div className="text-slate-500 text-xs mb-1">
                          {label}
                        </div>
                        <div className="text-white text-sm">{val}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
                      Items
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs">
                          <th className="text-left pb-2">Item</th>
                          <th className="text-left pb-2">UOM</th>
                          <th className="text-center pb-2">Requested</th>
                          <th className="text-center pb-2">Approved</th>
                          <th className="text-center pb-2">Fulfilled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.items || []).map((i) => (
                          <tr
                            key={i.request_item_id}
                            className="border-b border-slate-800"
                          >
                            <td className="py-2 text-white">{i.item_name}</td>
                            <td className="py-2 text-slate-400 text-xs">
                              {i.item_uom}
                            </td>
                            <td className="py-2 font-mono text-white text-center">
                              {i.requested_qty}
                            </td>
                            <td className="py-2 font-mono text-center">
                              <span className="text-emerald-400">
                                {i.approved_qty ?? "—"}
                              </span>
                            </td>
                            <td className="py-2 font-mono text-center">
                              <span className="text-blue-400">
                                {i.fulfilled_qty ?? "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Sub Store Modal */}
      {showStoreForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowStoreForm(false)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-bold text-base">Add Sub Store</h2>
              <button
                onClick={() => setShowStoreForm(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Store Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={storeForm.store_code}
                    onChange={(e) =>
                      setStoreForm((f) => ({
                        ...f,
                        store_code: e.target.value,
                      }))
                    }
                    placeholder="SS-005"
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Store Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={storeForm.store_name}
                    onChange={(e) =>
                      setStoreForm((f) => ({
                        ...f,
                        store_name: e.target.value,
                      }))
                    }
                    placeholder="Sub Store West"
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Address
                </label>
                <input
                  value={storeForm.address}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Block D, West Zone"
                  className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Phone
                </label>
                <input
                  value={storeForm.phone}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="021-111-0006"
                  className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setShowStoreForm(false)}
                  className="px-4 py-2 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStore}
                  disabled={savingStore}
                  className="px-4 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {savingStore ? "Saving..." : "Add Store"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
