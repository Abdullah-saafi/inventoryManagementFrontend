import { useEffect, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
  submitGRN,
} from "../../services/api";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import GRNModal from "../GRNModal";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = {
    PENDING: "border-yellow-400 text-yellow-600 bg-yellow-50",
    APPROVED: "border-emerald-400 text-emerald-600 bg-emerald-50",
    REJECTED: "border-red-400 text-red-600 bg-red-50",
    FULFILLED: "border-blue-400 text-blue-600 bg-blue-50",
    RECEIVED: "border-teal-400 text-teal-600 bg-teal-50",
    DISPUTED: "border-amber-400 text-amber-600 bg-amber-50",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || "border-gray-300 text-gray-500 bg-gray-50"}`}
    >
      {status}
    </span>
  );
};

// ─── FIX 3: Date + Time cell ──────────────────────────────────────────────────
const DateTimeCell = ({ ts }) => {
  if (!ts) return <span className="text-gray-300 text-xs">—</span>;
  const d = new Date(ts);
  return (
    <div>
      <div className="text-gray-600 text-xs font-mono">
        {d.toLocaleDateString()}
      </div>
      <div className="text-gray-400 text-xs font-mono">
        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
};

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
};

export default function MainReqToHO({ loading, mainStoreError, showToast }) {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [grnRequest, setGrnRequest] = useState(null);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnSubmitting, setGrnSubmitting] = useState(false);

  const handleError = useErrorHandler();

  const [form, setForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ ...EMPTY_LINE }],
  });

  const { auth } = useAuth();

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const params = { direction: "MAIN_TO_HO" };
      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin") {
        params.store_id = auth.store_id;
      } else if (filterStore) {
        params.store_id = filterStore;
      }
      const [sRes, rRes] = await Promise.all([
        getStores(),
        getRequests(params),
      ]);
      const all = sRes.data.data;
      setSubStores(all.filter((s) => s.store_type === "SUB_STORE"));
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
      setRequests(rRes.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setError(msg);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") load();
  }, [filterStatus, filterStore, auth.store_id]);

  // ── FIX 1: Load items from MAIN STORE (to_store_id), not sub store ─────────
  useEffect(() => {
    if (form.to_store_id) {
      getItems({ store_id: form.to_store_id })
        .then((r) => setStoreItems(r.data.data || []))
        .catch((e) => {
          setStoreItems([]);
          const msg = handleError(e, "Failed to load items");
          setError(msg);
        });
    } else {
      setStoreItems([]);
    }
  }, [form.to_store_id]);

  // ── FIX 2: Auto-fill main store when only one exists ──────────────────────
  useEffect(() => {
    if (mainStores.length === 1 && !form.to_store_id) {
      setForm((f) => ({ ...f, to_store_id: mainStores[0].store_id }));
    }
  }, [mainStores]);

  // ── Inline detail ──────────────────────────────────────────────────────────
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
    } catch (error) {
      const msg = handleError(error, "Failed to load request details");
      showToast(msg);
    } finally {
      setDL(false);
    }
  };

  const openGRN = async (e, r) => {
    e.stopPropagation();
    setGrnLoading(true);
    try {
      const res = await getRequestById(r.request_id);
      setGrnRequest(res.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load request details");
      showToast(msg);
    } finally {
      setGrnLoading(false);
    }
  };

  const handleGRNSubmit = async (payload) => {
    setGrnSubmitting(true);
    try {
      await submitGRN(grnRequest.request_id, payload);
      const label =
        payload.grn_status === "RECEIVED"
          ? "Delivery confirmed — marked as RECEIVED"
          : payload.grn_status === "DISPUTED"
            ? "Issues reported — request marked DISPUTED"
            : "Delivery rejected — main store notified";
      showToast(label, payload.grn_status === "RECEIVED" ? "success" : "warn");
      setGrnRequest(null);
      setDetail(null);
      load();
    } catch (e) {
      const msg = handleError(e, "Failed to submit GRN");
      showToast(msg);
    } finally {
      setGrnSubmitting(false);
    }
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const addLine = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  const removeLine = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const updateLine = (idx, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "selected_item_no") {
        if (value) {
          const found = storeItems.find((i) => i.item_no === value);
          if (found) {
            items[idx].item_no = found.item_no;
            items[idx].item_name = found.item_name;
            items[idx].item_uom = found.item_uom;
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

  const handleCreate = async () => {
    const { from_store_id, to_store_id, requested_by_name, items } = form;
    const invalid = items.some(
      (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
    );
    if (!from_store_id || !to_store_id || !requested_by_name || invalid)
      return showToast("Please fill all required fields", "error");

    setCreating(true);
    try {
      const payload = {
        ...form,
        direction: "MAIN_TO_HO",
        items: items.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
      };
      await createRequest(payload);
      showToast("Request submitted successfully", "success");
      setShowCreate(false);
      setForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        items: [{ ...EMPTY_LINE }],
      });
      load();
    } catch (e) {
      const msg = handleError(e, "Failed to submit");
      showToast(msg);
    } finally {
      setCreating(false);
    }
  };

  const pendingGRN = requests.filter(
    (r) => r.status === "FULFILLED" && !r.grn_at,
  ).length;

  // Auto-detect main store name for display
  const mainStoreName =
    mainStores.find((s) => s.store_id === form.to_store_id)?.store_name || "";
  const myStoreName =
    subStores.find((s) => s.store_id === auth.store_id)?.store_name || "";

  const getNextItemNo = (items = []) => {
    if (!items.length) return "ITM-001";

    const nums = items
      .map((i) => {
        const match = i.item_no?.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(Boolean);

    const max = nums.length ? Math.max(...nums) : 0;

    const prefixMatch = items[0]?.item_no?.match(/^\D+/);
    const prefix = prefixMatch ? prefixMatch[0] : "ITM-";

    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  };

  const paginatedRequests = requests.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <p className="text-gray-400 text-sm">{myStoreName}</p>
          {pendingGRN > 0 && (
            <div className="mt-1 flex items-center gap-2 text-xs text-blue-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
              {pendingGRN} delivery{pendingGRN > 1 ? "ies" : ""} waiting for
              your confirmation
            </div>
          )}
        </div>
        <button
          onClick={() => {
            const nextItemNo = getNextItemNo(storeItems);

            setForm({
              from_store_id: auth.store_id || "",
              to_store_id:
                mainStores.length === 1 ? mainStores[0].store_id : "",
              requested_by_name: auth.username || "",
              notes: "",
              items: [
                {
                  ...EMPTY_LINE,
                  item_no: nextItemNo, // 👈 auto-fill here
                },
              ],
            });

            setShowCreate(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          نئی درخواست
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-end h-full py-2 justify-between">
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 mx-3"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="RECEIVED">Received</option>
            <option value="DISPUTED">Disputed</option>
          </select>

          {auth.role === "super admin" && (
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Sub Stores</option>
              {subStores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="Temp-downloader">
          {/* Excel specific Date Downloader */}
          <div className="downloader">
            <ExcelDownloaderWithDates
              // data={request}
              dateKey="created_at"
              fileName="requests"
              columns={[
                { key: "request_id", label: "درخواست نمبر" },
                { key: "requested_by_name", label: "درخواست کنندہ" },
                {
                  key: "created_at",
                  label: "درخواست کی تاریخ",
                  format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
                },
                { key: "status", label: "حالت" },
                {
                  key: "approved_at",
                  label: "منظوری کی تاریخ",
                  format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
                },
                {
                  key: "fulfilled_at",
                  label: "تکمیل کی تاریخ",
                  format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Requests Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "درخواست نمبر",
                "درخواست کنندہ",
                "درخواست کا وقت",
                "حالت",
                "منظوری کا وقت",
                "مکمل ہونے کا وقت",
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
            {loading || pageLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : error || mainStoreError ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                    {error}
                  </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No requests found. Click New Request to place one.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                const needsGRN = r.status === "FULFILLED" && !r.grn_at;
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";

                return (
                  <>
                    <tr
                      key={r.request_id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        needsGRN
                          ? "bg-blue-50/40 hover:bg-blue-50"
                          : isDisputed
                            ? "bg-amber-50/40 hover:bg-amber-50"
                            : "hover:bg-gray-50"
                      } ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => openDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                          {r.item_count > 0 && (
                            <span className="bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                              {r.item_count} item{r.item_count > 1 ? "s" : ""}
                            </span>
                          )}
                          {needsGRN && (
                            <span className="bg-blue-100 text-blue-600 text-xs font-bold rounded px-1.5 py-0.5 border border-blue-200 animate-pulse">
                              ACTION NEEDED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.requested_by_name || "—"}
                      </td>

                      {/* FIX 3: requested_at with time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.requested_at || r.created_at} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* FIX 3: approved_at + fulfilled_at with time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.approved_at} />
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.fulfilled_at} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {needsGRN && (
                            <button
                              onClick={(e) => openGRN(e, r)}
                              disabled={grnLoading}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                            >
                              {grnLoading ? "…" : "Verify Delivery"}
                            </button>
                          )}
                          <span
                            className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                          >
                            {isExpanded ? "▲ چھپائیں" : "▼ تفصیلات"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr
                        key={r.request_id + "-detail"}
                        className="bg-gray-50 border-b-2 border-emerald-200"
                      >
                        <td colSpan={7} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(isDisputed || isReceived) &&
                                detail?.grn_note && (
                                  <div
                                    className={`rounded-xl p-3 border text-sm ${
                                      isDisputed
                                        ? "bg-amber-50 border-amber-200 text-amber-700"
                                        : "bg-teal-50 border-teal-200 text-teal-700"
                                    }`}
                                  >
                                    <div className="text-xs font-bold uppercase tracking-wider mb-1">
                                      {isDisputed
                                        ? "⚠ Sub Store Reported Issues"
                                        : "✓ Sub Store Confirmed Receipt"}
                                    </div>
                                    <div>{detail.grn_note}</div>
                                    {detail.grn_at && (
                                      <div className="text-xs opacity-60 mt-1">
                                        {new Date(
                                          detail.grn_at,
                                        ).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                              {detail?.rejection_reason && (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                  <div className="text-red-500 text-xs font-semibold mb-1">
                                    REJECTION REASON
                                  </div>
                                  <div className="text-red-600 text-sm">
                                    {detail.rejection_reason}
                                  </div>
                                </div>
                              )}

                              <div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 text-gray-400 text-xs">
                                      <th className="text-left pb-2 pr-4">
                                        چیز نمبر
                                      </th>
                                      <th className="text-left pb-2 pr-4">
                                        چیز کا نام
                                      </th>
                                      <th className="text-left pb-2 pr-4">
                                        پیمائش کی اکائی
                                      </th>
                                      <th className="text-center pb-2 pr-4">
                                        درخواست کردہ
                                      </th>
                                      <th className="text-center pb-2 pr-4">
                                        منظور شدہ
                                      </th>
                                      <th className="text-center pb-2 pr-4">
                                        مکمل شدہ
                                      </th>
                                      {(isDisputed || isReceived) && (
                                        <>
                                          <th className="text-center pb-2 pr-4">
                                            موصول شدہ
                                          </th>
                                          <th className="text-center pb-2">
                                            حالت
                                          </th>
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(detail?.items || []).map((i) => (
                                      <tr
                                        key={i.request_item_id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                                          {i.item_no}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-800">
                                          {i.item_name}
                                        </td>
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
                                        <td className="py-2 pr-4 font-mono text-center">
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
                                        {(isDisputed || isReceived) && (
                                          <>
                                            <td className="py-2 pr-4 font-mono text-center">
                                              <span
                                                className={
                                                  i.received_qty != null
                                                    ? Number(i.received_qty) <
                                                      Number(i.fulfilled_qty)
                                                      ? "text-amber-600"
                                                      : "text-teal-600"
                                                    : "text-gray-300"
                                                }
                                              >
                                                {i.received_qty ?? "—"}
                                              </span>
                                            </td>
                                            <td className="py-2 text-center">
                                              {i.item_condition ? (
                                                <span
                                                  className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${
                                                    i.item_condition === "OK"
                                                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                                      : i.item_condition ===
                                                          "DAMAGED"
                                                        ? "bg-amber-50 border-amber-300 text-amber-700"
                                                        : "bg-red-50 border-red-300 text-red-700"
                                                  }`}
                                                >
                                                  {i.item_condition}
                                                </span>
                                              ) : (
                                                <span className="text-gray-300">
                                                  —
                                                </span>
                                              )}
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {needsGRN && (
                                <div className="pt-2 border-t border-gray-200">
                                  <button
                                    onClick={(e) => openGRN(e, r)}
                                    disabled={grnLoading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
                                  >
                                    {grnLoading
                                      ? "Loading…"
                                      : "Verify Delivery"}
                                  </button>
                                </div>
                              )}
                            </div>
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
        <Pagination
          currentPage={page}
          totalItems={requests.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ── GRN Modal ── */}
      {grnRequest && (
        <GRNModal
          request={grnRequest}
          onClose={() => setGrnRequest(null)}
          onSubmit={handleGRNSubmit}
          submitting={grnSubmitting}
        />
      )}

      {/* ── Create Request Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-bold">نئی چیز کی درخواست</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Store info — read-only summary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    درخواست کنندہ
                  </label>
                  <input
                    value={form.requested_by_name}
                    readOnly
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    کے لیے (ہیڈ آفس)
                  </label>
                  {mainStores.length === 1 ? (
                    // FIX 2: auto-filled — show as read-only
                    <input
                      value="HeadOffice"
                      readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
                    />
                  ) : (
                    <select
                      value={form.to_store_id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, to_store_id: e.target.value }))
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
                  )}
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  نوٹس
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Optional reason or note"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Items section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs font-semibold uppercase">
                    چیزیں
                  </span>
                  <button
                    onClick={addLine}
                    className="text-xs text-emerald-600 hover:text-emerald-500 border border-gray-300 rounded px-2 py-1"
                  >
                    + صف شامل کریں
                  </button>
                </div>

                {/* FIX 1: show message until main store is selected */}
                {!form.to_store_id ? (
                  <div className="text-gray-400 text-xs text-center py-6 border border-dashed border-gray-300 rounded-lg">
                    Select a Main Store first to load available items
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                            Item {idx + 1}
                          </span>
                          <button
                            onClick={() => removeLine(idx)}
                            disabled={form.items.length === 1}
                            className="text-red-400 hover:text-red-500 disabled:opacity-30 text-lg font-bold leading-none"
                          >
                            ×
                          </button>
                        </div>

                        {/* Catalogue search dropdown */}
                        <div className="mb-3">
                          <label className="text-gray-500 text-xs mb-1 block">
                            Select from catalogue ({storeItems.length} items
                            available)
                          </label>
                          <div className="relative mt-1.5">
                            <input
                              value={item.item_search}
                              onChange={(e) => {
                                updateLine(idx, "item_search", e.target.value);
                                updateLine(idx, "_showDropdown", true);
                              }}
                              onFocus={() =>
                                updateLine(idx, "_showDropdown", true)
                              }
                              onBlur={() =>
                                setTimeout(
                                  () => updateLine(idx, "_showDropdown", false),
                                  150,
                                )
                              }
                              placeholder="Search by item name or number…"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                            />
                            {item._showDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                <div
                                  className="px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
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
                                          `${si.item_no} — ${si.item_name}`,
                                        );
                                        updateLine(idx, "_showDropdown", false);
                                      }}
                                      className={`px-3 py-2 cursor-pointer hover:bg-emerald-50 border-t border-gray-100 flex items-center justify-between ${item.selected_item_no === si.item_no ? "bg-emerald-50" : ""}`}
                                    >
                                      <div>
                                        <span className="font-mono text-emerald-600 text-xs font-bold">
                                          {si.item_no}
                                        </span>
                                        <span className="text-gray-700 text-xs ml-2">
                                          {si.item_name}
                                        </span>
                                      </div>
                                      <div className="text-gray-400 text-xs">
                                        {parseFloat(si.item_quantity).toFixed(
                                          0,
                                        )}{" "}
                                        {si.item_uom}
                                      </div>
                                    </div>
                                  ))}
                                {storeItems.filter((si) => {
                                  const q = (
                                    item.item_search || ""
                                  ).toLowerCase();
                                  return (
                                    !q ||
                                    si.item_no.toLowerCase().includes(q) ||
                                    si.item_name.toLowerCase().includes(q)
                                  );
                                }).length === 0 && (
                                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
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
                            چیز کی تفصیلات
                          </span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-2">
                            <label className="text-gray-500 text-xs mb-1 block">
                              چیز نمبر
                            </label>
                            <input
                              readOnly
                              value={item.item_no}
                              onChange={(e) =>
                                updateLine(idx, "item_no", e.target.value)
                              }
                              placeholder="ITM-001"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="col-span-5">
                            <label className="text-gray-500 text-xs mb-1 block">
                              چیز کا نام
                            </label>
                            {/* FIX 2: read-only when selected from catalogue */}
                            <input
                              value={item.item_name}
                              readOnly={!!item.selected_item_no}
                              onChange={(e) =>
                                !item.selected_item_no &&
                                updateLine(idx, "item_name", e.target.value)
                              }
                              placeholder="Full item name"
                              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none ${
                                item.selected_item_no
                                  ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-white border-gray-300 text-gray-800 focus:border-emerald-500"
                              }`}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-gray-500 text-xs mb-1 block">
                              UOM *
                            </label>
                            {/* FIX 2: read-only when selected from catalogue */}
                            <input
                              value={item.item_uom}
                              readOnly={!!item.selected_item_no}
                              onChange={(e) =>
                                !item.selected_item_no &&
                                updateLine(idx, "item_uom", e.target.value)
                              }
                              placeholder="pcs"
                              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none ${
                                item.selected_item_no
                                  ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-white border-gray-300 text-gray-800 focus:border-emerald-500"
                              }`}
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-gray-500 text-xs mb-1 block">
                              مقدار
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.requested_qty}
                              onChange={(e) =>
                                updateLine(
                                  idx,
                                  "requested_qty",
                                  +e.target.value,
                                )
                              }
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setShowCreate(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                >
                  منسوخ کریں
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
                >
                  {creating ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
