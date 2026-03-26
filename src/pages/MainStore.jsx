<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  fulfillRequest,
  getStores,
  getItems,
  createRequest,
  createItem,
} from "../services/api";
import { useAuth } from "../context/authContext";

const StatusBadge = ({ status }) => {
  const s = {
    PENDING: "bg-yellow-50 text-yellow-600 border-yellow-300",
    APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-300",
    REJECTED: "bg-red-50 text-red-600 border-red-300",
    FULFILLED: "bg-blue-50 text-blue-600 border-blue-300",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || ""}`}
    >
      {status}
    </span>
  );
};
=======
import { useEffect, useState } from "react";
import { getRequests, getStores, getItems } from "../services/api";
import MainAllItems from "../components/Mainallitems";
import MainSubStoreReqs from "../components/Mainsubstorereqs";
import MainReqStatus from "../components/Mainreqstatus";
import MainReqToHO from "../components/Mainreqtoho";
>>>>>>> phase-01

const TABS = [
  { id: "items", label: "All Items" },
  { id: "requests", label: "Sub Store Requests" },
  { id: "ho-status", label: "HO Requests Status" },
  { id: "ho-create", label: "New HO Request" },
];

export default function MainStore() {
  const [tab, setTab] = useState("items");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [hoRequests, setHoRequests] = useState([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const {auth} = useAuth()
  const isAdmin = auth?.role === "super admin" 

  // ── Load all data ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
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
      setHeadOffices(
        allStores.filter(
          (s) => s.store_type && s.store_type.toUpperCase().includes("HEAD"),
        ),
      );
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── Badge counts ──────────────────────────────────────────────────────────
  const pendingApproved = requests.filter(
    (r) => r.status === "APPROVED",
  ).length;
  const pendingHo = hoRequests.filter((r) => r.status === "PENDING").length;

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
          Manage sub store requests, track inventory flow, and request from Head
          Office
        </p>
      </div>

      {/* Tab navigation */}
      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center gap-1 flex-wrap shadow-sm">
        {TABS.map((t) => {
          const badge =
            t.id === "requests" && pendingApproved > 0
              ? pendingApproved
              : t.id === "ho-status" && pendingHo > 0
                ? pendingHo
                : null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${tab === t.id ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
            >
              {t.label}
              {badge && (
                <span
                  className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none
                  ${tab === t.id ? "bg-white/20 text-white" : "bg-emerald-600 text-white"}`}
                >
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
          onRefresh={load}
          showToast={showToast}
        />
      )}

      {tab === "requests" && (
<<<<<<< HEAD
        <div>
          <div className="mb-4">
            <select
              value={reqFilter}
              onChange={(e) => setReqFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="FULFILLED">Fulfilled</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    "Request No",
                    "From",
                    "To",
                    "Requested By",
                    "Approved By",
                    "Date",
                    "Status",
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
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const isExpanded =
                      detail && detail.request_id === r.request_id;
                    return (
                      <React.Fragment key={r.request_id}>
                        <tr
                          key={r.request_id}
                          className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? "bg-gray-50" : ""}`}
                          onClick={() => openDetail(r)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-emerald-600 text-xs font-bold">
                              {r.request_no}
                            </span>
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
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 items-center">
                              <span
                                className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                              >
                                {isExpanded ? "▲ Hide" : "▼ Details"}
                              </span>
                              {r.status === "APPROVED" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFulfill(r.request_id);
                                  }}
                                  disabled={fulfilling === r.request_id}
                                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 disabled:opacity-40 ml-1"
                                >
                                  {fulfilling === r.request_id
                                    ? "..."
                                    : "Fulfill"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr
                            key={r.request_id + "-detail"}
                            className="bg-gray-50 border-b-2 border-emerald-200"
                          >
                            <td colSpan={8} className="px-6 py-4">
                              {detailLoad ? (
                                <div className="flex justify-center py-6">
                                  <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                                </div>
                              ) : (
                                detail &&
                                renderInlineDetail(
                                  detail,
                                  detailLoad,
                                  handleFulfill,
                                  fulfilling,
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
        </div>
=======
        <MainSubStoreReqs
          requests={requests}
          onRefresh={load}
          showToast={showToast}
        />
>>>>>>> phase-01
      )}

      {tab === "ho-status" && <MainReqStatus hoRequests={hoRequests} />}

<<<<<<< HEAD
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Request No", "Requested By", "Date", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredHoRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      No HO requests found.
                    </td>
                  </tr>
                ) : (
                  filteredHoRequests.map((r) => {
                    const isExpanded =
                      hoDetail && hoDetail.request_id === r.request_id;
                    return (
                      <React.Fragment key={r.request_id}>
                        <tr
                          key={r.request_id}
                          className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? "bg-gray-50" : ""}`}
                          onClick={() => openHoDetail(r)}
                        >
                          <td className="px-4 py-3 font-mono text-yellow-600 text-xs font-bold">
                            {r.request_no}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {r.requested_by_name || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                            >
                              {isExpanded ? "▲ Hide" : "▼ Details"}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr
                            key={r.request_id + "-detail"}
                            className="bg-gray-50 border-b-2 border-yellow-200"
                          >
                            <td colSpan={5} className="px-6 py-4">
                              {hoDetailLoad ? (
                                <div className="flex justify-center py-6">
                                  <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                                </div>
                              ) : (
                                hoDetail &&
                                renderInlineDetail(
                                  hoDetail,
                                  hoDetailLoad,
                                  null,
                                  null,
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
        </div>
      )}

      {/* ── TAB: NEW HO REQUEST ──────────────────────────────────────────── */}
      {tab === "ho-create" && (
        <div className="max-w-2xl">
          <div className="mb-4">
            <h2 className="text-gray-900 font-semibold text-base">
              New Request to Head Office
            </h2>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  From (Main Store) *
                </label>
                <select
                  value={hoForm.from_store_id}
                  onChange={(e) =>
                    setHoForm((f) => ({ ...f, from_store_id: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Main Store</option>
                  {mainStores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  To (Head Office) *
                </label>
                <select
                  value={hoForm.to_store_id}
                  onChange={(e) =>
                    setHoForm((f) => ({ ...f, to_store_id: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Head Office</option>
                  {headOffices.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                Requested By *
              </label>
              <input
                value={hoForm.requested_by_name}
                onChange={(e) =>
                  setHoForm((f) => ({
                    ...f,
                    requested_by_name: e.target.value,
                  }))
                }
                placeholder="Your name"
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                Notes
              </label>
              <textarea
                value={hoForm.notes}
                onChange={(e) =>
                  setHoForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                placeholder="Optional reason"
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-semibold uppercase">
                  Items
                </span>
                <button
                  onClick={addLine}
                  className="text-xs text-emerald-600 hover:text-emerald-500 border border-gray-300 rounded px-2 py-1"
                >
                  + Add Row
                </button>
              </div>
              <div className="space-y-3">
                {hoForm.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        Item {idx + 1}
                      </span>
                      <button
                        onClick={() => removeLine(idx)}
                        disabled={hoForm.items.length === 1}
                        className="text-red-400 hover:text-red-500 disabled:opacity-30 text-lg font-bold leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mb-3">
                      <label className="text-gray-500 text-xs mb-1 block">
                        Select from catalogue
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          value={item.item_search}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHoForm((f) => {
                              const items = [...f.items];
                              items[idx] = {
                                ...items[idx],
                                item_search: val,
                                _showDropdown: true,
                              };
                              return { ...f, items };
                            });
                          }}
                          onFocus={() => updateLine(idx, "_showDropdown", true)}
                          onBlur={() =>
                            setTimeout(
                              () => updateLine(idx, "_showDropdown", false),
                              150,
                            )
                          }
                          placeholder="Search by item name or number…"
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                        />
                        {item._showDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            <div
                              className="px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer"
                              onMouseDown={() => {
                                setHoForm((f) => {
                                  const items = [...f.items];
                                  items[idx] = {
                                    ...items[idx],
                                    selected_item_no: "",
                                    item_search: "",
                                    item_no: "",
                                    item_name: "",
                                    item_uom: "",
                                    _showDropdown: false,
                                  };
                                  return { ...f, items };
                                });
                              }}
                            >
                              — Not listed / enter manually —
                            </div>
                            {storeItems
                              .filter((si) => {
                                const q = (
                                  item.item_search || ""
                                ).toLowerCase();
                                return (
                                  !q ||
                                  si.item_no.toLowerCase().includes(q) ||
                                  si.item_name.toLowerCase().includes(q)
                                );
                              })
                              .map((si) => (
                                <div
                                  key={si.item_id}
                                  onMouseDown={() => {
                                    setHoForm((f) => {
                                      const items = [...f.items];
                                      items[idx] = {
                                        ...items[idx],
                                        selected_item_no: si.item_no,
                                        item_no: si.item_no,
                                        item_name: si.item_name,
                                        item_uom: si.item_uom,
                                        item_search:
                                          si.item_no + " — " + si.item_name,
                                        _showDropdown: false,
                                      };
                                      return { ...f, items };
                                    });
                                  }}
                                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-t border-gray-100 ${item.selected_item_no === si.item_no ? "bg-emerald-50" : ""}`}
                                >
                                  <span className="font-mono text-emerald-600 text-xs">
                                    {si.item_no}
                                  </span>
                                  <span className="text-gray-800 text-xs ml-2">
                                    {si.item_name}
                                  </span>
                                  <span className="text-gray-400 text-xs ml-2">
                                    · Stock:{" "}
                                    {parseFloat(si.item_quantity).toFixed(0)}{" "}
                                    {si.item_uom}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-gray-400 text-xs">
                        item details
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-2">
                        <label className="text-gray-500 text-xs mb-1 block">
                          Item No *
                        </label>
                        <input
                          value={item.item_no}
                          onChange={(e) =>
                            updateLine(idx, "item_no", e.target.value)
                          }
                          placeholder="ITM-001"
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-gray-500 text-xs mb-1 block">
                          Item Name *
                        </label>
                        <input
                          value={item.item_name}
                          onChange={(e) =>
                            updateLine(idx, "item_name", e.target.value)
                          }
                          placeholder="Full item name"
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-gray-500 text-xs mb-1 block">
                          UOM *
                        </label>
                        <input
                          value={item.item_uom}
                          onChange={(e) =>
                            updateLine(idx, "item_uom", e.target.value)
                          }
                          placeholder="pcs / kg…"
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-gray-500 text-xs mb-1 block">
                          Qty *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.requested_qty}
                          onChange={(e) =>
                            updateLine(idx, "requested_qty", +e.target.value)
                          }
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200">
              <button
                onClick={handleHoRequest}
                disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40"
              >
                {creating ? "Submitting..." : "Submit Request to Head Office"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ITEM MODAL ────────────────────────────────────────────────── */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-gray-900 font-bold text-base">
                Add New Item
              </h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Item No{" "}
                  <span className="text-gray-400 font-normal normal-case">
                    (auto-generated, editable)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={newItem.item_no}
                    readOnly
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, item_no: e.target.value }))
                    }
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-emerald-600 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={regenerateItemNo}
                    title="Generate new number"
                    className="px-3 py-2 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-sm"
                  >
                    ↻
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Item Name *
                </label>
                <input
                  readOnly={isAdmin}
                  value={newItem.item_name}
                  onChange={(e) =>
                    setNewItem((f) => ({ ...f, item_name: e.target.value }))
                  }
                  placeholder="e.g. Surgical Gloves"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    UOM *
                  </label>
                  <input
                    value={newItem.item_uom}
                    readOnly={isAdmin}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, item_uom: e.target.value }))
                    }
                    placeholder="pcs / kg / box…"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <input
                    value={newItem.category}
                    readOnly={isAdmin}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="e.g. Medical"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    readOnly={isAdmin}
                    min="0"
                    value={newItem.item_quantity}
                    onChange={(e) =>
                      setNewItem((f) => ({
                        ...f,
                        item_quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    readOnly={isAdmin}
                    min="0"
                    value={newItem.min_quantity}
                    onChange={(e) =>
                      setNewItem((f) => ({
                        ...f,
                        min_quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Store *
                </label>
                <select
                  value={newItem.store_id}
                  readOnly={isAdmin}
                  onChange={(e) =>
                    setNewItem((f) => ({ ...f, store_id: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select store</option>
                  {mainStores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={savingItem}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40"
              >
                {savingItem ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
=======
      {tab === "ho-create" && (
        <MainReqToHO
          mainStores={mainStores}
          headOffices={headOffices}
          onSubmitted={() => {
            setTab("ho-status");
            load();
          }}
          showToast={showToast}
        />
>>>>>>> phase-01
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
          ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
