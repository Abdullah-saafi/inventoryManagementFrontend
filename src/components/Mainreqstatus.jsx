import { useState } from "react";
import { getRequestById } from "../services/api";
import StatusBadge from "../components/Statusbadge";

// ── Date + time cell (matches SubStore style) ─────────────────────────────────
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

// ── Inline detail panel ───────────────────────────────────────────────────────
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
    <div>
      <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
        Items
      </div>
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
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
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
      {/* ── Filter row ── */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          value={hoFilter}
          onChange={(e) => setHoFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* ── Table ── */}
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
                const isExpanded =
                  hoDetail && hoDetail.request_id === r.request_id;

                return (
                  <>
                    <tr
                      key={r.request_id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                        isExpanded ? "bg-gray-50" : ""
                      }`}
                      onClick={() => openHoDetail(r)}
                    >
                      {/* Request No + item count badge */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-yellow-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                          {r.item_count > 0 && (
                            <span className="bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                              {r.item_count} item{r.item_count > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {r.requested_by_name || "—"}
                      </td>

                      {/* Requested At — date + time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.created_at} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Approved At — date + time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.approved_at} />
                      </td>

                      {/* Fulfilled At — date + time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.fulfilled_at} />
                      </td>

                      {/* Rejected At — date + time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.rejected_at} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs transition-colors ${
                            isExpanded ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          {isExpanded ? "▲ Hide" : "▼ View"}
                        </span>
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
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
