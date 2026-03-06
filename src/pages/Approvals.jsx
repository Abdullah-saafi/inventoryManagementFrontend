import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  fulfillRequest,
} from "../services/api";
import {
  PageHeader,
  Table,
  TR,
  TD,
  Btn,
  Modal,
  Field,
  Input,
  Textarea,
  StatusBadge,
  Spinner,
  ErrorMsg,
  Toast,
} from "../components/UI";

export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilter] = useState("");

  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);

  const [approveModal, setApproveModal] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  const [actioning, setActioning] = useState(false);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejecterName, setRejecterName] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (filterStatus) params.status = filterStatus;
      const r = await getRequests(params);
      setRequests(r.data.data);
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

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

  // Open approve modal — preload items for qty editing
  const openApprove = async (r) => {
    try {
      const res = await getRequestById(r.request_id);
      const items = res.data.data.items || [];
      setEditedItems(
        items.map((i) => ({ ...i, approved_qty: i.requested_qty })),
      );
      setApproveModal(r);
      setApproverName("");
    } catch {
      setToast({ message: "Failed to load request items", type: "error" });
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) return;
    setActioning(true);
    try {
      await approveRequest(approveModal.request_id, {
        approved_by_name: approverName,
        approved_items: editedItems.map((i) => ({
          request_item_id: i.request_item_id,
          approved_qty: i.approved_qty,
        })),
      });
      await fulfillRequest(approveModal.request_id);
      setToast({
        message: "Request approved and inventory updated",
        type: "success",
      });
      setApproveModal(null);
      setApproverName("");
      setEditedItems([]);
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Error approving",
        type: "error",
      });
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!rejecterName.trim() || !rejectReason.trim()) return;
    setActioning(true);
    try {
      await rejectRequest(rejectModal.request_id, {
        approved_by_name: rejecterName,
        rejection_reason: rejectReason,
      });
      setToast({ message: "Request rejected", type: "info" });
      setRejectModal(null);
      setRejecterName("");
      setRejectReason("");
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Error rejecting",
        type: "error",
      });
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} />;

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle="Review all sub store requests and approve or reject them"
      />

      {/* Pending count notice */}
      {pendingCount > 0 && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-amber-400 text-sm font-semibold">
            {pendingCount} request{pendingCount > 1 ? "s" : ""} waiting for
            approval
          </span>
          <Btn size="sm" variant="outline" onClick={() => setFilter("PENDING")}>
            Show Pending
          </Btn>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["", "PENDING", "APPROVED", "FULFILLED", "REJECTED"].map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={filterStatus === s ? "primary" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </Btn>
        ))}
      </div>

      {/* Table */}
      <Table
        headers={[
          "Request No",
          "From",
          "To",
          "Requested By",
          "Date",
          "Status",
          "Actions",
        ]}
      >
        {requests.length === 0 ? (
          <TR>
            <TD className="text-center py-10 text-slate-500">
              No requests found.
            </TD>
          </TR>
        ) : (
          requests.map((r) => (
            <TR key={r.request_id}>
              <TD>
                <span className="font-mono text-emerald-400 text-xs font-bold">
                  {r.request_no}
                </span>
              </TD>
              <TD>{r.from_store_name}</TD>
              <TD>{r.to_store_name}</TD>
              <TD>{r.requested_by_name || "—"}</TD>
              <TD>
                <span className="text-slate-500 text-xs">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </TD>
              <TD>
                <StatusBadge status={r.status} />
              </TD>
              <TD>
                <div className="flex gap-1">
                  <Btn size="sm" variant="ghost" onClick={() => openDetail(r)}>
                    Details
                  </Btn>
                  {r.status === "PENDING" && (
                    <>
                      <Btn
                        size="sm"
                        variant="primary"
                        onClick={() => openApprove(r)}
                      >
                        Approve
                      </Btn>
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setRejectModal(r);
                          setRejecterName("");
                          setRejectReason("");
                        }}
                      >
                        Reject
                      </Btn>
                    </>
                  )}
                </div>
              </TD>
            </TR>
          ))
        )}
      </Table>

      {/* Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Request — ${detail?.request_no}`}
        width="max-w-xl"
      >
        {detailLoad ? (
          <Spinner />
        ) : (
          detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Status", <StatusBadge status={detail.status} />],
                  ["From", detail.from_store_name],
                  ["To", detail.to_store_name],
                  ["Requested By", detail.requested_by_name || "—"],
                  ["Approved By", detail.approved_by_name || "—"],
                  ["Date", new Date(detail.requested_at).toLocaleDateString()],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-800 rounded p-2">
                    <div className="text-slate-500 text-xs mb-1">{label}</div>
                    <div className="text-white text-sm">{val}</div>
                  </div>
                ))}
              </div>

              {detail.rejection_reason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <div className="text-red-400 text-xs font-semibold mb-1">
                    REJECTION REASON
                  </div>
                  <div className="text-red-300 text-sm">
                    {detail.rejection_reason}
                  </div>
                </div>
              )}

              {detail.notes && (
                <div className="bg-slate-800 rounded p-3">
                  <div className="text-slate-500 text-xs mb-1">NOTES</div>
                  <div className="text-slate-300 text-sm">{detail.notes}</div>
                </div>
              )}

              <div>
                <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
                  Items
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs">
                      <th className="text-left pb-2">Item No</th>
                      <th className="text-left pb-2">Name</th>
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
                        <td className="py-2 font-mono text-emerald-400 text-xs">
                          {i.item_no}
                        </td>
                        <td className="py-2 text-white">{i.item_name}</td>
                        <td className="py-2 text-slate-400 text-xs">
                          {i.item_uom}
                        </td>
                        <td className="py-2 font-mono text-white text-center">
                          {i.requested_qty}
                        </td>
                        <td className="py-2 font-mono text-center">
                          <span
                            className={
                              i.approved_qty != null
                                ? "text-emerald-400"
                                : "text-slate-600"
                            }
                          >
                            {i.approved_qty ?? "—"}
                          </span>
                        </td>
                        <td className="py-2 font-mono text-center">
                          <span
                            className={
                              i.fulfilled_qty != null
                                ? "text-blue-400"
                                : "text-slate-600"
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

              {detail.status === "PENDING" && (
                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <Btn
                    variant="primary"
                    onClick={() => {
                      setDetail(null);
                      openApprove(detail);
                    }}
                  >
                    Approve
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      setDetail(null);
                      setRejectModal(detail);
                      setRejecterName("");
                      setRejectReason("");
                    }}
                  >
                    Reject
                  </Btn>
                </div>
              )}
            </div>
          )
        )}
      </Modal>

      {/* Approve Modal — with editable quantities */}
      <Modal
        open={!!approveModal}
        onClose={() => setApproveModal(null)}
        title={`Approve — ${approveModal?.request_no}`}
        width="max-w-lg"
      >
        <div className="space-y-4">
          <Field label="Your Name" required>
            <Input
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              placeholder="Approver name"
            />
          </Field>

          <div>
            <div className="text-slate-400 text-xs uppercase font-semibold mb-2">
              Edit approved quantities if needed
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-center pb-2">Requested</th>
                  <th className="text-center pb-2">Approve Qty</th>
                </tr>
              </thead>
              <tbody>
                {editedItems.map((i, idx) => (
                  <tr
                    key={i.request_item_id}
                    className="border-b border-slate-800"
                  >
                    <td className="py-2">
                      <div className="text-white text-sm">{i.item_name}</div>
                      <div className="text-slate-500 text-xs font-mono">
                        {i.item_no} · {i.item_uom}
                      </div>
                    </td>
                    <td className="py-2 font-mono text-slate-400 text-center">
                      {i.requested_qty}
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={i.requested_qty}
                        value={i.approved_qty}
                        onChange={(e) => {
                          const updated = [...editedItems];
                          updated[idx] = {
                            ...updated[idx],
                            approved_qty: +e.target.value,
                          };
                          setEditedItems(updated);
                        }}
                        className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
            <Btn variant="ghost" onClick={() => setApproveModal(null)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={handleApprove}
              disabled={actioning || !approverName.trim()}
            >
              {actioning ? "Processing..." : "Confirm Approve"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title={`Reject — ${rejectModal?.request_no}`}
      >
        <div className="space-y-4">
          <Field label="Your Name" required>
            <Input
              value={rejecterName}
              onChange={(e) => setRejecterName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Rejection Reason" required>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain why this request is being rejected"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
            <Btn variant="ghost" onClick={() => setRejectModal(null)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              onClick={handleReject}
              disabled={
                actioning || !rejecterName.trim() || !rejectReason.trim()
              }
            >
              {actioning ? "Rejecting..." : "Confirm Reject"}
            </Btn>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
