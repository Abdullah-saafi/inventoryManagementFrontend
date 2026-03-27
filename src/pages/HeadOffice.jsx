import React, { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  fulfillRequest,
  getItems,
  getStores,
} from "../services/api";
import Toast from "../components/Toast";

const BADGE = {
  PENDING: "bg-yellow-50 text-yellow-600 border-yellow-300",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-300",
  REJECTED: "bg-red-50 text-red-600 border-red-300",
  FULFILLED: "bg-blue-50 text-blue-600 border-blue-300",
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${BADGE[status] || "border-gray-300 text-gray-500"}`}
  >
    {status}
  </span>
);

export default function HeadOffice() {
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);

  const [items, setItems] = useState([]);
  const [filterStore, setFilterStore] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = { direction: "MAIN_TO_HO" };
      if (filter) params.status = filter;
      const r = await getRequests(params);
      setRequests(r.data.data);
    } catch {
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const params = {};
      if (filterStore) params.store_id = filterStore;
      if (filterCategory) params.category = filterCategory;
      const [iRes, sRes] = await Promise.all([getItems(params), getStores()]);
      setItems(iRes.data.data);
    } catch {
      showToast("Failed to load inventory", "error");
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);
  useEffect(() => {
    if (tab === "inventory") loadItems();
  }, [tab, filterStore, filterCategory]);

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
    } finally {
      setDL(false);
    }
  };

  const handleFulfill = async (requestId) => {
    setFulfilling(requestId);
    try {
      await fulfillRequest(requestId);
      showToast("Request fulfilled — Main Store inventory updated");
      setDetail(null);
      loadRequests();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fulfill", "error");
    } finally {
      setFulfilling(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "APPROVED").length;
  const displayed = items.filter(
    (i) =>
      !search ||
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.item_no.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Head Office</h1>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {[
          { id: "requests", label: "Fulfill Requests", count: pendingCount },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors
              ${tab === t.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-400 hover:text-gray-700"}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="bg-emerald-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-5 text-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <div>
          {pendingCount > 0 && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <span className="text-emerald-700 text-sm font-semibold">
                {pendingCount} request{pendingCount > 1 ? "s" : ""} approved by
                Main Store Manager — waiting for you to fulfill
              </span>
            </div>
          )}

          <div className="mb-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">
                Pending (awaiting manager approval)
              </option>
              <option value="APPROVED">Approved — Ready to Fulfill</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[
                      "Request No",
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
                      <td
                        colSpan={6}
                        className="text-center py-12 text-gray-400"
                      >
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
                              {r.item_count > 0 && (
                                <span className="ml-2 bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                                  {r.item_count} item
                                  {r.item_count > 1 ? "s" : ""}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {r.requested_by_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
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
                                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 disabled:opacity-40 ml-1"
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
                              <td colSpan={6} className="px-6 py-4">
                                {detailLoad ? (
                                  <div className="flex justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                                  </div>
                                ) : (
                                  detail && (
                                    <div className="space-y-3">
                                      {detail.notes && (
                                        <div className="bg-white rounded p-3 border border-gray-200">
                                          <div className="text-gray-400 text-xs mb-1">
                                            NOTES
                                          </div>
                                          <div className="text-gray-700 text-sm">
                                            {detail.notes}
                                          </div>
                                        </div>
                                      )}
                                      {detail.rejection_reason && (
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
                                                Item No
                                              </th>
                                              <th className="text-left pb-2 pr-4">
                                                Item Name
                                              </th>
                                              <th className="text-left pb-2 pr-4">
                                                UOM
                                              </th>
                                              <th className="text-center pb-2 pr-4">
                                                Requested
                                              </th>
                                              <th className="text-center pb-2">
                                                Fulfilled
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(detail.items || []).map((i) => (
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
                                      {detail.status === "APPROVED" && (
                                        <div className="pt-2 border-t border-gray-200">
                                          <button
                                            onClick={() =>
                                              handleFulfill(detail.request_id)
                                            }
                                            disabled={
                                              fulfilling === detail.request_id
                                            }
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
                                          >
                                            {fulfilling === detail.request_id
                                              ? "Processing..."
                                              : "Fulfill Request"}
                                          </button>
                                        </div>
                                      )}
                                    </div>
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
          )}
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
