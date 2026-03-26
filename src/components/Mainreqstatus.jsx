import { useState } from "react";
import { getRequestById } from "../services/api";
import StatusBadge from "../components/Statusbadge";

// Helper: format a date string or return "—" if falsy
const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString() : "—";

const renderInlineDetail = (d) => (
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
  </div>
);

export default function MainReqStatus({ hoRequests }) {
  const [hoFilter, setHoFilter] = useState("");
  const [hoDetail, setHoDetail] = useState(null);
  const [hoDetailLoad, setHoDL] = useState(false);

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

  const filtered = hoFilter
    ? hoRequests.filter((r) => r.status === hoFilter)
    : hoRequests;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          All requests submitted to Head Office
        </p>
        <select
          value={hoFilter}
          onChange={(e) => setHoFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
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
                "Requested At",
                "Status",
                "Approved At",
                "Fulfilled At",
                "Rejected At",
                " ",
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
                  No HO requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
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

                      {/* Requested At — always created_at */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {fmt(r.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Approved At — only shown when status is APPROVED / FULFILLED */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {fmt(r.approved_at)}
                      </td>

                      {/* Fulfilled At — only set when status is FULFILLED */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {fmt(r.fulfilled_at)}
                      </td>

                      {/* Rejected At — only set when status is REJECTED */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {fmt(r.rejected_at)}
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
                        <td colSpan={8} className="px-6 py-4">
                          {hoDetailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            hoDetail && renderInlineDetail(hoDetail)
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
  );
}
