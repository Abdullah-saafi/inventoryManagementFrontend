import { useEffect, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
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
  Select,
  Textarea,
  StatusBadge,
  Spinner,
  ErrorMsg,
  Toast,
} from "../components/UI";

export default function SubStore() {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: "",
    notes: "",
    items: [{ item_no: "", item_name: "", item_uom: "", requested_qty: 1 }],
  });

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        getStores(),
        getRequests({ direction: "SUB_TO_MAIN" }),
      ]);
      const all = sRes.data.data;
      setSubStores(all.filter((s) => s.store_type === "SUB_STORE"));
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
      setRequests(rRes.data.data);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (form.from_store_id) {
      getItems({ store_id: form.from_store_id }).then((r) =>
        setStoreItems(r.data.data),
      );
    } else {
      setStoreItems([]);
    }
  }, [form.from_store_id]);

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

  const addLine = () =>
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { item_no: "", item_name: "", item_uom: "", requested_qty: 1 },
      ],
    }));
  const removeLine = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "item_no") {
        const found = storeItems.find((i) => i.item_no === value);
        if (found) {
          items[idx].item_name = found.item_name;
          items[idx].item_uom = found.item_uom;
        }
      }
      return { ...f, items };
    });
  };

  const handleCreate = async () => {
    const { from_store_id, to_store_id, requested_by_name, items } = form;
    if (
      !from_store_id ||
      !to_store_id ||
      !requested_by_name ||
      items.some((i) => !i.item_no || i.requested_qty < 1)
    )
      return setToast({
        message: "Please fill all required fields",
        type: "error",
      });
    setCreating(true);
    try {
      await createRequest({ ...form, direction: "SUB_TO_MAIN" });
      setToast({ message: "Request submitted successfully", type: "success" });
      setShowCreate(false);
      setForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        items: [{ item_no: "", item_name: "", item_uom: "", requested_qty: 1 }],
      });
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Failed to submit",
        type: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} />;

  return (
    <div>
      <PageHeader
        title="Sub Store"
        subtitle="Place item requests and check approval status"
        action={<Btn onClick={() => setShowCreate(true)}>New Request</Btn>}
      />

      <Table
        headers={[
          "Request No",
          "From",
          "To",
          "Requested By",
          "Date",
          "Status",
          "",
        ]}
      >
        {requests.length === 0 ? (
          <TR>
            <TD className="text-center py-10 text-slate-500">
              No requests yet. Click New Request to place one.
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
                <Btn size="sm" variant="ghost" onClick={() => openDetail(r)}>
                  View
                </Btn>
              </TD>
            </TR>
          ))
        )}
      </Table>

      {/* Create Request Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Item Request"
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sub Store" required>
              <Select
                value={form.from_store_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, from_store_id: e.target.value }))
                }
              >
                <option value="">Select Sub Store</option>
                {subStores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Main Store" required>
              <Select
                value={form.to_store_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, to_store_id: e.target.value }))
                }
              >
                <option value="">Select Main Store</option>
                {mainStores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Requested By" required>
            <Input
              value={form.requested_by_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, requested_by_name: e.target.value }))
              }
              placeholder="Your name"
            />
          </Field>

          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Optional reason"
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Items
              </span>
              <Btn size="sm" variant="ghost" onClick={addLine}>
                + Add Row
              </Btn>
            </div>
            {!form.from_store_id ? (
              <div className="text-slate-500 text-xs text-center py-6 border border-dashed border-slate-700 rounded-lg">
                Select a Sub Store first to load available items
              </div>
            ) : (
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800 rounded-lg p-3 grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-5">
                      <label className="text-slate-500 text-xs mb-1 block">
                        Item
                      </label>
                      <select
                        value={item.item_no}
                        onChange={(e) =>
                          updateLine(idx, "item_no", e.target.value)
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select item</option>
                        {storeItems.map((si) => (
                          <option key={si.item_id} value={si.item_no}>
                            {si.item_no} — {si.item_name} (Stock:{" "}
                            {si.item_quantity} {si.item_uom})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-slate-500 text-xs mb-1 block">
                        Name
                      </label>
                      <input
                        value={item.item_name}
                        readOnly
                        placeholder="Auto-filled"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-400 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-slate-500 text-xs mb-1 block">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.requested_qty}
                        onChange={(e) =>
                          updateLine(idx, "requested_qty", +e.target.value)
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-slate-500 text-xs mb-1 block">
                        UOM
                      </label>
                      <input
                        value={item.item_uom}
                        readOnly
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-400 text-xs text-center"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pb-1">
                      <button
                        onClick={() => removeLine(idx)}
                        disabled={form.items.length === 1}
                        className="text-red-400 hover:text-red-300 disabled:opacity-30 text-lg font-bold"
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleCreate} disabled={creating}>
              {creating ? "Submitting..." : "Submit Request"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
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
