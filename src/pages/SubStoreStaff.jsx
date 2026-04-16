import { useEffect, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
  submitGRN,
} from "../services/api";
import { useAuth } from "../context/authContext";
import GRNModal from "../components/GRNModal";
import Toast from "../components/Toast";
import BlockedUI from "../components/BlockedUI";
import useErrorHandler from "../components/useErrorHandler";
import SubStoreHeader from "../components/SubStoreHeader";
import SubStoreFilters from "../components/SubStoreFilters";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import RequestRow from "../components/RequestRow";
import CreateRequestModal from "../components/CreateRequestModal";
import Pagination from "../components/Pagination";

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 0,
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
  const [grnRequest, setGrnRequest] = useState(null);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnSubmitting, setGrnSubmitting] = useState(false);

  // ── Pagination state ─────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // ─────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ ...EMPTY_LINE }],
  });

  const { auth } = useAuth();
  const handleError = useErrorHandler();

  const load = async () => {
    setPageLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
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

  useEffect(() => {
    if (form.to_store_id) {
      getItems({ store_id: form.to_store_id })
        .then((r) => setStoreItems(r.data.data || []))
        .catch((e) => {
          setStoreItems([]);
          const msg = handleError(e, "Failed to set store items");
          setError(msg);
        });
    } else {
      setStoreItems([]);
    }
  }, [form.to_store_id]);

  useEffect(() => {
    if (mainStores.length === 1 && !form.to_store_id) {
      setForm((f) => ({ ...f, to_store_id: mainStores[0].store_id }));
    }
  }, [mainStores]);

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
      const msg = handleError(error, "Failed to get request");
      showToastMsg(msg);
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
      showToastMsg(msg);
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
      const msg = handleError(e, "Failed to submit GRN");
      showToastMsg(msg);
    } finally {
      setGrnSubmitting(false);
    }
  };

  const showToastMsg = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addLine = () => {
    setForm((f) => {
      const allItems = [...storeItems, ...f.items];
      const nextItemNo = getNextItemNo(allItems);
      return {
        ...f,
        items: [...f.items, { ...EMPTY_LINE, item_no: nextItemNo }],
      };
    });
  };
  const removeLine = (idx) => {
    setForm((f) => {
      const items = f.items.filter((_, i) => i !== idx);
      return {
        ...f,
        items: items.length ? items : [{ ...EMPTY_LINE }],
      };
    });
  };
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

  const handleCreate = async (e) => {
    e.preventDefault();
    const { from_store_id, to_store_id, requested_by_name, items } = form;
    const invalid = items.some(
      (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
    );
    if (!from_store_id || !to_store_id || !requested_by_name || invalid)
      return showToastMsg("Please fill all required fields", "error");
    setCreating(true);
    try {
      const payload = {
        ...form,
        direction: "SUB_TO_MAIN",
        items: items.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
      };
      await createRequest(payload);
      showToastMsg("Request submitted successfully", "success");
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
      showToastMsg(msg, "error");
      console.log(msg,"error")
    } finally {
      setCreating(false);
    }
  };

  const pendingGRN = requests.filter(
    (r) => r.status === "FULFILLED" && !r.grn_at,
  ).length;

  const getNextItemNo = (items = []) => {
    if (!items.length) return "ITM-001";
    let max = 0;
    let prefix = "ITM-";
    items.forEach((item) => {
      const match = item.item_no?.match(/(\D+)(\d+)$/);
      if (match) {
        prefix = match[1];
        const num = parseInt(match[2], 10);
        if (num > max) max = num;
      }
    });
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  };

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  // ── Paginated slice ──────────────────────────────────────────
  const paginatedRequests = requests.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  // ─────────────────────────────────────────────────────────────

  return (
    <div>
      <SubStoreHeader
        username={auth.username}
        pendingGRN={pendingGRN}
        onNewRequest={() => {
          const nextItemNo = getNextItemNo(storeItems);
          setForm({
            from_store_id: auth.store_id || "",
            to_store_id: mainStores.length === 1 ? mainStores[0].store_id : "",
            requested_by_name: auth.username || "",
            notes: "",
            items: [{ ...EMPTY_LINE, item_no: nextItemNo }],
          });
          setShowCreate(true);
        }}
      />
      <div className="flex items-end justify-between py-2">
        <div className="Filter">
          <SubStoreFilters
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterStore={filterStore}
            setFilterStore={setFilterStore}
            role={auth.role}
            subStores={subStores}
          />
        </div>
        {/* Excel specific Date Downloader */}
        <div className="downloader">
          <ExcelDownloaderWithDates
            data={requests}
            dateKey="created_at"
            fileName={auth.username}
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

      {/* Main table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "درخواست نمبر",
                "درخواست کنندہ",
                "درخواست کی تاریخ",
                "حالت",
                "منظوری کی تاریخ",
                "تکمیل کی تاریخ",
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
                <td colSpan={9} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                    {error}
                  </div>
                </td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No requests found. Click New Request to place one.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((r) => (
                <RequestRow
                  key={r.request_id}
                  r={r}
                  detail={detail}
                  detailLoad={detailLoad}
                  openDetail={openDetail}
                  openGRN={openGRN}
                  grnLoading={grnLoading}
                />
              ))
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        <Pagination
          currentPage={page}
          totalItems={requests.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
        />
      </div>

      {grnRequest && (
        <GRNModal
          request={grnRequest}
          onClose={() => setGrnRequest(null)}
          onSubmit={handleGRNSubmit}
          submitting={grnSubmitting}
        />
      )}
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
      {toast && (
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
