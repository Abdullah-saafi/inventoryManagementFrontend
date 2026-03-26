import React, { useState } from "react";
import { getRequestById, fulfillRequest } from "../services/api";
import StatusBadge from "./StatusBadge";

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
            <td className="py-2 pr-4 text-gray-400 text-xs">{i.item_uom}</td>
            <td className="py-2 pr-4 font-mono text-gray-800 text-center">
              {i.requested_qty}
            </td>
            <td className="py-2 pr-4 font-mono text-center">
              <span
                className={
                  i.approved_qty != null ? "text-emerald-600" : "text-gray-300"
                }
              >
                {i.approved_qty ?? "—"}
              </span>
            </td>
            <td className="py-2 font-mono text-center">
              <span
                className={
                  i.fulfilled_qty != null ? "text-blue-600" : "text-gray-300"
                }
              >
                {i.fulfilled_qty ?? "—"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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

export default function MainSubStoreReqs({ requests, onRefresh, showToast }) {
  const [reqFilter, setReqFilter] = useState("APPROVED");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);

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

  const handleFulfill = async (requestId) => {
    setFulfilling(requestId);
    try {
      await fulfillRequest(requestId);
      showToast("Request fulfilled and inventory updated");
      setDetail(null);
      onRefresh();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fulfill", "error");
    } finally {
      setFulfilling(null);
    }
  };

  const filtered = reqFilter
    ? requests.filter((r) => r.status === reqFilter)
    : requests;

  return (
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
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
                              {fulfilling === r.request_id ? "..." : "Fulfill"}
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
  );
}
