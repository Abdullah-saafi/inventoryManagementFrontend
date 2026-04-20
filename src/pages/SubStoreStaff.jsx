import { useEffect, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
} from "../services/api";
import { useAuth } from "../context/authContext";
import GRNModal from "../components/GRNModal";
import API from "../services/api";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import Toast from "../components/Toast";
import StatusBadge from "../components/StatusBadge";
import SubStoreFilters from "../components/StoreFilters";
import Pagination from "../components/Pagination";
import CreateRequestModal from "../components/CreateRequestModal";

const submitGRN = (id, data) => API.patch(`/requests/${id}/grn`, data);

// ─── Date + Time cell ─────────────────────────────────────────────────────────
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

// ─── Type badge ───────────────────────────────────────────────────────────────
const TypeBadge = ({ hasItems, hasAssets }) => {
  if (hasItems && hasAssets)
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded px-1.5 py-0.5">
          📦 Items
        </span>
        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded px-1.5 py-0.5">
          🖥️ Assets
        </span>
      </div>
    );
  if (hasAssets)
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded px-1.5 py-0.5">
        🖥️ Assets
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded px-1.5 py-0.5">
      📦 Items
    </span>
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

const EMPTY_FORM = {
  from_store_id: "",
  to_store_id: "",
  requested_by_name: "",
  notes: "",
  is_emergency: false,
  items: [{ ...EMPTY_LINE }],
  requested_assets: [],
};

export default function SubStore() {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
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
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { auth } = useAuth();

  // ─── Load ─────────────────────────────────────────────────────────────────
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
    } catch {
      setError("Failed to load data");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") load();
  }, [filterStatus, filterStore, auth.store_id]);

  useEffect(() => {
    if (form.to_store_id) {
      getItems({ store_id: form.to_store_id })
        .then((r) => setStoreItems(r.data.data || []))
        .catch(() => setStoreItems([]));
    } else {
      setStoreItems([]);
    }
  }, [form.to_store_id]);

  useEffect(() => {
    if (mainStores.length === 1 && !form.to_store_id) {
      setForm((f) => ({ ...f, to_store_id: mainStores[0].store_id }));
    }
  }, [mainStores]);

  // ─── Detail ───────────────────────────────────────────────────────────────
  const openDetail = async (r) => {
    if (detail && detail.request_id === r.request_id) {
      setDetail(null);
      return;
    }
    setDL(true);
    setDetail({ ...r, items: [], assets: [] });
    try {
      const res = await getRequestById(r.request_id);
      setDetail(res.data.data);
    } catch {
    } finally {
      setDL(false);
    }
  };

  // ─── GRN ──────────────────────────────────────────────────────────────────
  const openGRN = async (e, r) => {
    e.stopPropagation();
    setGrnLoading(true);
    try {
      const res = await getRequestById(r.request_id);
      setGrnRequest(res.data.data);
    } catch {
      showToastMsg("Failed to load request details", "error");
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
      showToastMsg(
        label,
        payload.grn_status === "RECEIVED" ? "success" : "warn",
      );
      setGrnRequest(null);
      setDetail(null);
      load();
    } catch (e) {
      showToastMsg(
        e.response?.data?.message || "Failed to submit GRN",
        "error",
      );
    } finally {
      setGrnSubmitting(false);
    }
  };

  const showToastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Form helpers ─────────────────────────────────────────────────────────
  const addLine = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  const removeLine = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "selected_item_no") {
        const found = storeItems.find((i) => i.item_no === value);
        if (found) {
          items[idx].item_no = found.item_no;
          items[idx].item_name = found.item_name;
          items[idx].item_uom = found.item_uom;
        } else {
          items[idx].item_no = items[idx].item_name = items[idx].item_uom = "";
        }
      }
      return { ...f, items };
    });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e?.preventDefault();
    const {
      from_store_id,
      to_store_id,
      requested_by_name,
      items,
      requested_assets,
    } = form;

    const itemLines = items.filter((i) => i.item_no);
    const hasItems = itemLines.length > 0;
    const hasAssets = requested_assets.length > 0;

    if (!from_store_id || !to_store_id || !requested_by_name)
      return showToastMsg("Please fill all required fields", "error");
    if (!hasItems && !hasAssets)
      return showToastMsg("Add at least one item or one asset", "error");
    if (
      hasItems &&
      itemLines.some((i) => !i.item_name || !i.item_uom || i.requested_qty < 1)
    )
      return showToastMsg("Check item details", "error");

    setCreating(true);
    try {
      const payload = {
        from_store_id,
        to_store_id,
        requested_by_name,
        notes: form.notes,
        is_emergency: form.is_emergency,
        direction: "MAIN_TO_HO",
        items: itemLines.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
        requested_assets: requested_assets.map((a) => a.asset_id),
      };
      await createRequest(payload);
      showToastMsg("Request submitted successfully", "success");
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch (e) {
      showToastMsg(e.response?.data?.message || "Failed to submit", "error");
    } finally {
      setCreating(false);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const pendingGRN = requests.filter(
    (r) => r.status === "FULFILLED" && !r.grn_at,
  ).length;
  const myStoreName =
    subStores.find((s) => s.store_id === auth.store_id)?.store_name || "";
  const paginated = requests.slice((page - 1) * pageSize, page * pageSize);

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
            setForm({
              ...EMPTY_FORM,
              from_store_id: auth.store_id || "",
              to_store_id:
                mainStores.length === 1 ? mainStores[0].store_id : "",
              requested_by_name: auth.username || "",
            });
            setShowCreate(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          نئی درخواست
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 mb-4 items-center h-full py-2 justify-between">
        <SubStoreFilters
          filterStatus={filterStatus}
          setFilterStatus={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
          filterStore={filterStore}
          setFilterStore={(v) => {
            setFilterStore(v);
            setPage(1);
          }}
          role={auth.role}
          subStores={subStores}
        />
        <div className="Temp-downloader">
          <ExcelDownloaderWithDates
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

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "درخواست نمبر",
                "نوع",
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
            {pageLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                    {error}
                  </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No requests found. Click New Request to place one.
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                const needsGRN = r.status === "FULFILLED" && !r.grn_at;
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";
                const hasItems = (r.item_count ?? 0) > 0;
                const hasAssets = (r.asset_count ?? 0) > 0;

                return (
                  <>
                    <tr
                      key={r.request_id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors
                        ${needsGRN ? "bg-blue-50/40 hover:bg-blue-50" : isDisputed ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-gray-50"}
                        ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => openDetail(r)}
                    >
                      {/* Request No */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-emerald-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                          {needsGRN && (
                            <span className="bg-blue-100 text-blue-600 text-xs font-bold rounded px-1.5 py-0.5 border border-blue-200 animate-pulse">
                              ACTION NEEDED
                            </span>
                          )}
                          {r.is_emergency && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold rounded px-1.5 py-0.5 border border-red-200">
                              🚨 URGENT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <TypeBadge hasItems={hasItems} hasAssets={hasAssets} />
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {r.requested_by_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.requested_at || r.created_at} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.approved_at} />
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.fulfilled_at} />
                      </td>

                      {/* Actions */}
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

                    {/* Expanded detail */}
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
                            <DetailPanel
                              detail={detail}
                              isDisputed={isDisputed}
                              isReceived={isReceived}
                              needsGRN={needsGRN}
                              grnLoading={grnLoading}
                              onOpenGRN={(e) => openGRN(e, r)}
                            />
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
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      {/* GRN Modal */}
      {grnRequest && (
        <GRNModal
          request={grnRequest}
          onClose={() => setGrnRequest(null)}
          onSubmit={handleGRNSubmit}
          submitting={grnSubmitting}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateRequestModal
          form={form}
          setForm={setForm}
          mainStores={mainStores}
          storeItems={storeItems}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          addLine={addLine}
          removeLine={removeLine}
          updateLine={updateLine}
          creating={creating}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({
  detail,
  isDisputed,
  isReceived,
  needsGRN,
  grnLoading,
  onOpenGRN,
}) {
  if (!detail) return null;
  const showGRNColumns = isDisputed || isReceived;
  const hasItems = detail.items?.length > 0;
  const hasAssets = detail.assets?.length > 0;

  return (
    <div className="space-y-4">
      {/* GRN note */}
      {showGRNColumns && detail.grn_note && (
        <div
          className={`rounded-xl p-3 border text-sm ${isDisputed ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-teal-50 border-teal-200 text-teal-700"}`}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-1">
            {isDisputed
              ? "⚠ Sub Store Reported Issues"
              : "✓ Sub Store Confirmed Receipt"}
          </div>
          <div>{detail.grn_note}</div>
          {detail.grn_at && (
            <div className="text-xs opacity-60 mt-1">
              {new Date(detail.grn_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {detail.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="text-red-500 text-xs font-semibold mb-1">
            REJECTION REASON
          </div>
          <div className="text-red-600 text-sm">{detail.rejection_reason}</div>
        </div>
      )}

      {/* Consumable Items */}
      {hasItems && (
        <div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>📦 Consumable Items</span>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded">
              {detail.items.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-xs">
                <th className="text-left pb-2 pr-4">چیز نمبر</th>
                <th className="text-left pb-2 pr-4">چیز کا نام</th>
                <th className="text-left pb-2 pr-4">UOM</th>
                <th className="text-center pb-2 pr-4">درخواست کردہ</th>
                <th className="text-center pb-2 pr-4">منظور شدہ</th>
                <th className="text-center pb-2 pr-4">مکمل شدہ</th>
                {showGRNColumns && (
                  <>
                    <th className="text-center pb-2 pr-4">موصول شدہ</th>
                    <th className="text-center pb-2">حالت</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {detail.items.map((i) => (
                <tr
                  key={i.request_item_id}
                  className="border-b border-gray-100"
                >
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
                  {showGRNColumns && (
                    <>
                      <td className="py-2 pr-4 font-mono text-center">
                        <span
                          className={
                            i.received_qty != null
                              ? Number(i.received_qty) < Number(i.fulfilled_qty)
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
                                : i.item_condition === "DAMAGED"
                                  ? "bg-amber-50 border-amber-300 text-amber-700"
                                  : "bg-red-50 border-red-300 text-red-700"
                            }`}
                          >
                            {i.item_condition}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assets */}
      {hasAssets && (
        <div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>🖥️ Assets</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
              {detail.assets.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-xs">
                <th className="text-left pb-2 pr-4">Asset Name</th>
                <th className="text-left pb-2 pr-4">Serial No.</th>
                <th className="text-center pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.assets.map((a) => (
                <tr key={a.asset_id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-800 font-medium">
                    {a.asset_name}
                  </td>
                  <td className="py-2 pr-4 font-mono text-blue-600 text-xs">
                    {a.serial_number}
                  </td>
                  <td className="py-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded border text-xs font-bold ${
                        a.status === "AVAILABLE"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : a.status === "ASSIGNED"
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-red-50 border-red-300 text-red-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GRN button */}
      {needsGRN && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={onOpenGRN}
            disabled={grnLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
          >
            {grnLoading ? "Loading…" : "Verify Delivery"}
          </button>
        </div>
      )}
    </div>
  );
}
