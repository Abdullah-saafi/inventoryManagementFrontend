import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  fulfillRequest,
  getStores,
  getItems,
  createRequest,
  getItemSummary,
} from "../services/api";

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

const TABS = [
  { id: "items", label: "All Items" },
  { id: "requests", label: "Sub Store Requests" },
  { id: "ho-status", label: "HO Requests Status" },
  { id: "ho-create", label: "New HO Request" },
];

const EMPTY_HO_ITEM = {
  item_no: "",
  item_name: "",
  item_uom: "",
  item_category: "",
  requested_qty: 1,
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
};

export default function MainStore() {
  const [tab, setTab] = useState("items");

  const [requests, setRequests] = useState([]);
  const [reqFilter, setReqFilter] = useState("APPROVED");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [mainStores, setMainStores] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [itemSummaryReceived, setItemSummaryReceived] = useState([]);
  const [itemSummaryGiven, setItemSummaryGiven] = useState([]);
  const [hoRequests, setHoRequests] = useState([]);
  const [hoDetail, setHoDetail] = useState(null);
  const [hoDetailLoad, setHoDL] = useState(false);
  const [hoFilter, setHoFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [hoForm, setHoForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ ...EMPTY_HO_ITEM }],
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (reqFilter) params.status = reqFilter;
      const [rRes, sRes, iRes] = await Promise.all([
        getRequests(params),
        getStores(),
        getItems(),
      ]);
      setRequests(rRes.data.data);
      const allStores = sRes.data.data;
      setMainStores(allStores.filter((s) => s.store_type === "MAIN_STORE"));
      setHeadOffices(allStores.filter((s) => s.store_type === "HEAD_OFFICE"));
      setItems(iRes.data.data);

      const [recvSummary, givenSummary, hoReqRes] = await Promise.all([
        getItemSummary({ direction: "MAIN_TO_HO" }),
        getItemSummary({ direction: "SUB_TO_MAIN" }),
        getRequests({ direction: "MAIN_TO_HO" }),
      ]);
      setItemSummaryReceived(recvSummary.data.data);
      setItemSummaryGiven(givenSummary.data.data);
      setHoRequests(hoReqRes.data.data);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reqFilter]);

  useEffect(() => {
    if (hoForm.from_store_id)
      getItems({ store_id: hoForm.from_store_id })
        .then((r) => setStoreItems(r.data.data || []))
        .catch(() => setStoreItems([]));
    else setStoreItems([]);
  }, [hoForm.from_store_id]);

  const openDetail = async (r) => {
    if (detail && detail.request_id === r.request_id) {
      setDetail(null);
      return;
    }
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

  const openHoDetail = async (r) => {
    if (hoDetail && hoDetail.request_id === r.request_id) {
      setHoDetail(null);
      return;
    }
    setHoDL(true);
    setHoDetail({ ...r, items: [] });
    try {
      const res = await getRequestById(r.request_id);
      setHoDetail(res.data.data);
    } catch {
    } finally {
      setHoDL(false);
    }
  };

  const handleFulfill = async (requestId) => {
    setFulfilling(requestId);
    try {
      await fulfillRequest(requestId);
      showToast("Request fulfilled and inventory updated");
      setDetail(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fulfill", "error");
    } finally {
      setFulfilling(null);
    }
  };

  const addLine = () =>
    setHoForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_HO_ITEM }] }));
  const removeLine = (idx) =>
    setHoForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx, field, value) => {
    setHoForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "selected_item_no") {
        if (value) {
          const found = storeItems.find((i) => i.item_no === value);
          if (found) {
            items[idx].item_no = found.item_no;
            items[idx].item_name = found.item_name;
            items[idx].item_uom = found.item_uom;
            items[idx].item_search = found.item_no + " — " + found.item_name;
          }
        } else {
          items[idx].item_no = "";
          items[idx].item_name = "";
          items[idx].item_uom = "";
        }
      }
      return { ...f, items };
    });
  };

  const handleHoRequest = async () => {
    const { from_store_id, to_store_id, requested_by_name, items } = hoForm;
    if (
      !from_store_id ||
      !to_store_id ||
      !requested_by_name ||
      items.some(
        (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
      )
    )
      return showToast("Please fill all required fields", "error");
    setCreating(true);
    try {
      await createRequest({
        ...hoForm,
        direction: "MAIN_TO_HO",
        items: items.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
      });
      showToast("Request submitted to Head Office");
      setHoForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        items: [{ ...EMPTY_HO_ITEM }],
      });
      setTab("ho-status");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to submit", "error");
    } finally {
      setCreating(false);
    }
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const groupedItems = Object.values(
    items.reduce((acc, i) => {
      const qty = parseFloat(i.item_quantity || 0);
      if (!acc[i.item_no]) {
        acc[i.item_no] = {
          ...i,
          item_quantity: qty,
          main_qty: i.store_type === "MAIN_STORE" ? qty : 0,
          sub_qty: i.store_type === "SUB_STORE" ? qty : 0,
        };
      } else {
        acc[i.item_no].item_quantity += qty;
        if (i.store_type === "MAIN_STORE") acc[i.item_no].main_qty += qty;
        if (i.store_type === "SUB_STORE") acc[i.item_no].sub_qty += qty;
      }
      return acc;
    }, {}),
  );
  const displayedItems = groupedItems.filter((i) => {
    const matchSearch =
      !search ||
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.item_no.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || i.category === filterCategory;
    return matchSearch && matchCat;
  });
  const filteredHoRequests = hoFilter
    ? hoRequests.filter((r) => r.status === hoFilter)
    : hoRequests;
  const pendingApproved = requests.filter(
    (r) => r.status === "APPROVED",
  ).length;

  const renderInlineDetail = (d, isLoading, onFulfill, fulfillingId) => (
    <div className="space-y-3">
      {d.notes && (
        <div className="bg-white rounded p-3 border border-gray-200">
          <div className="text-gray-400 text-xs mb-1">NOTES</div>
          <div className="text-gray-700 text-sm">{d.notes}</div>
        </div>
      )}
      {d.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="text-red-500 text-xs font-semibold mb-1">
            REJECTION REASON
          </div>
          <div className="text-red-600 text-sm">{d.rejection_reason}</div>
        </div>
      )}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 text-xs">
              <th className="text-left pb-2 pr-4">Item No</th>
              <th className="text-left pb-2 pr-4">Item Name</th>
              <th className="text-left pb-2 pr-4">UOM</th>
              <th className="text-center pb-2 pr-4">Requested</th>
              <th className="text-center pb-2 pr-4">Approved</th>
              <th className="text-center pb-2">Fulfilled</th>
            </tr>
          </thead>
          <tbody>
            {(d.items || []).map((i) => (
              <tr key={i.request_item_id} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                  {i.item_no}
                </td>
                <td className="py-2 pr-4 text-gray-800">{i.item_name}</td>
                <td className="py-2 pr-4 text-gray-400 text-xs">
                  {i.item_uom}
                </td>
                <td className="py-2 pr-4 font-mono text-gray-800 text-center">
                  {i.requested_qty}
                </td>
                <td className="py-2 pr-4 font-mono text-center">
                  <span
                    className={
                      i.approved_qty != null
                        ? "text-emerald-600"
                        : "text-gray-300"
                    }
                  >
                    {i.approved_qty ?? "—"}
                  </span>
                </td>
                <td className="py-2 font-mono text-center">
                  <span
                    className={
                      i.fulfilled_qty != null
                        ? "text-blue-600"
                        : "text-gray-300"
                    }
                  >
                    {i.fulfilled_qty ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d.status === "APPROVED" && onFulfill && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => onFulfill(d.request_id)}
            disabled={fulfillingId === d.request_id}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
          >
            {fulfillingId === d.request_id
              ? "Processing..."
              : "Mark as Fulfilled"}
          </button>
        </div>
      )}
    </div>
  );

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
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Main Store</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage sub store requests, track inventory flow, and request from Head
          Office
        </p>
      </div>

      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center gap-1 flex-wrap shadow-sm">
        {TABS.map((t) => {
          const badge =
            t.id === "requests" && pendingApproved > 0
              ? pendingApproved
              : t.id === "ho-status" &&
                  hoRequests.filter((r) => r.status === "PENDING").length > 0
                ? hoRequests.filter((r) => r.status === "PENDING").length
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

      {/* TAB: SUB STORE REQUESTS */}
      {tab === "requests" && (
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
                      <>
                        <tr
                          key={r.request_id}
                          className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? "bg-gray-50" : ""}`}
                          onClick={() => openDetail(r)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-emerald-600 text-xs font-bold">
                              {r.request_no}
                            </span>
                            {r.item_count > 0 && (
                              <span className="ml-2 bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                                {r.item_count} item{r.item_count > 1 ? "s" : ""}
                              </span>
                            )}
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
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ALL ITEMS */}
      {tab === "items" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or item number..."
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500 w-64"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {(search || filterCategory) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterCategory("");
                }}
                className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded"
              >
                Clear
              </button>
            )}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    "Item No",
                    "Name",
                    "Category",
                    "UOM",
                    "Total Stock",
                    "Sent to Sub-Stores",
                    "Available Stock",
                    "Min Stock",
                    "Status",
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
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      No items found.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((i) => {
                    const isLow =
                      parseFloat(i.item_quantity) <= parseFloat(i.min_quantity);
                    return (
                      <tr
                        key={i.item_id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-emerald-600 text-xs">
                            {i.item_no}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-semibold">
                          {i.item_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {i.category || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {i.item_uom}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-bold ${isLow ? "text-red-500" : "text-gray-800"}`}
                          >
                            {Number(i.item_quantity).toFixed(0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                          {Number(i.sub_qty).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-emerald-600 font-bold">
                          {Number(i.main_qty).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                          {i.min_quantity}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold ${isLow ? "text-red-500" : "text-emerald-600"}`}
                          >
                            {isLow ? "Low" : "OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: HO REQUESTS STATUS */}
      {tab === "ho-status" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              All requests submitted by Main Store to Head Office
            </p>
            <select
              value={hoFilter}
              onChange={(e) => setHoFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">
                Pending (awaiting manager approval)
              </option>
              <option value="APPROVED">
                Approved (waiting HO fulfillment)
              </option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    "Request No",
                    "Requested By",
                    "Date",
                    "Items",
                    "Total Qty",
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
                {filteredHoRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No HO requests found.
                    </td>
                  </tr>
                ) : (
                  filteredHoRequests.map((r) => {
                    const isExpanded =
                      hoDetail && hoDetail.request_id === r.request_id;
                    return (
                      <>
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
                          <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                            {r.item_count}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {r.status === "FULFILLED" ? (
                              <span className="text-emerald-600 font-bold">
                                {parseFloat(r.total_fulfilled || 0).toFixed(0)}
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                {parseFloat(r.total_requested || 0).toFixed(0)}
                              </span>
                            )}
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
                            <td colSpan={7} className="px-6 py-4">
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
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: NEW HO REQUEST */}
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
                      <label className="text-gray-500 text-xs mb-1 flex items-center gap-1.5">
                        <span>Select from catalogue</span>
                        <span className="text-gray-400 italic font-normal">
                          — or leave blank and enter manually below
                        </span>
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          value={item.item_search}
                          onChange={(e) => {
                            updateLine(idx, "item_search", e.target.value);
                            updateLine(idx, "_showDropdown", true);
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
                                updateLine(idx, "selected_item_no", "");
                                updateLine(idx, "item_search", "");
                                updateLine(idx, "_showDropdown", false);
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
                                    updateLine(
                                      idx,
                                      "selected_item_no",
                                      si.item_no,
                                    );
                                    updateLine(
                                      idx,
                                      "item_search",
                                      si.item_no + " — " + si.item_name,
                                    );
                                    updateLine(idx, "_showDropdown", false);
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
                            {storeItems.filter((si) => {
                              const q = (item.item_search || "").toLowerCase();
                              return (
                                !q ||
                                si.item_no.toLowerCase().includes(q) ||
                                si.item_name.toLowerCase().includes(q)
                              );
                            }).length === 0 && (
                              <div className="px-3 py-2 text-xs text-gray-400 italic">
                                No items match your search
                              </div>
                            )}
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
                          placeholder="e.g. ITM-001"
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
                          Available
                        </label>
                        {(() => {
                          const found = storeItems.find(
                            (si) => si.item_no === item.item_no,
                          );
                          return found ? (
                            <div className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700">
                              {parseFloat(found.item_quantity).toFixed(0)}{" "}
                              {found.item_uom}
                            </div>
                          ) : (
                            <div className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-400 italic">
                              —
                            </div>
                          );
                        })()}
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

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
          ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
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
