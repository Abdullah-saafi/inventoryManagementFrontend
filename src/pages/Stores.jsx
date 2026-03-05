import { useEffect, useState } from "react";
import {
  getStores,
  createStore,
  updateStore,
  getStoreInventory,
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
  StoreTypeBadge,
  Spinner,
  ErrorMsg,
  Toast,
} from "../components/UI";

const EMPTY_FORM = {
  store_code: "",
  store_name: "",
  store_type: "SUB_STORE",
  address: "",
  phone: "",
};

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [invStore, setInvStore] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getStores()
      .then((r) => setStores(r.data.data))
      .catch(() => setError("Failed to load stores"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      store_code: s.store_code,
      store_name: s.store_name,
      store_type: s.store_type,
      address: s.address || "",
      phone: s.phone || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.store_code || !form.store_name) return;
    setSaving(true);
    try {
      if (editing) {
        await updateStore(editing.store_id, form);
        setToast({ message: "Store updated!", type: "success" });
      } else {
        await createStore(form);
        setToast({ message: "Store created!", type: "success" });
      }
      setShowForm(false);
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Error saving store",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const openInventory = async (store) => {
    setInvStore(store);
    setInvLoading(true);
    try {
      const r = await getStoreInventory(store.store_id);
      setInventory(r.data.data);
    } catch {
      setInventory([]);
    } finally {
      setInvLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} />;

  return (
    <div>
      <PageHeader
        title="Stores"
        subtitle="Manage Head Office, Main Store and Sub Stores"
        action={<Btn onClick={openCreate}>+ New Store</Btn>}
      />

      <Table
        headers={[
          "Code",
          "Name",
          "Type",
          "Address",
          "Phone",
          "Status",
          "Actions",
        ]}
      >
        {stores.map((s) => (
          <TR key={s.store_id}>
            <TD>
              <span className="font-mono text-emerald-400 text-xs">
                {s.store_code}
              </span>
            </TD>
            <TD>
              <span className="font-semibold text-white">{s.store_name}</span>
            </TD>
            <TD>
              <StoreTypeBadge type={s.store_type} />
            </TD>
            <TD>
              <span className="text-xs">{s.address || "—"}</span>
            </TD>
            <TD>{s.phone || "—"}</TD>
            <TD>
              <span
                className={`text-xs font-semibold ${s.is_active ? "text-emerald-400" : "text-slate-500"}`}
              >
                {s.is_active ? "Active" : "Inactive"}
              </span>
            </TD>
            <TD>
              <div className="flex gap-2">
                <Btn size="sm" variant="ghost" onClick={() => openInventory(s)}>
                  Inventory
                </Btn>
                <Btn size="sm" variant="outline" onClick={() => openEdit(s)}>
                  Edit
                </Btn>
              </div>
            </TD>
          </TR>
        ))}
      </Table>

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Store" : "Create Store"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Store Code" required>
              <Input
                value={form.store_code}
                onChange={(e) =>
                  setForm({ ...form, store_code: e.target.value })
                }
                placeholder="SS-004"
                disabled={!!editing}
              />
            </Field>
            <Field label="Store Type" required>
              <Select
                value={form.store_type}
                onChange={(e) =>
                  setForm({ ...form, store_type: e.target.value })
                }
                disabled={!!editing}
              >
                <option value="HEAD_OFFICE">Head Office</option>
                <option value="MAIN_STORE">Main Store</option>
                <option value="SUB_STORE">Sub Store</option>
              </Select>
            </Field>
          </div>
          <Field label="Store Name" required>
            <Input
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              placeholder="Sub Store West"
            />
          </Field>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Block D, West Zone"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="021-111-0006"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Inventory Modal */}
      <Modal
        open={!!invStore}
        onClose={() => setInvStore(null)}
        title={`${invStore?.store_name} — Inventory`}
        width="max-w-2xl"
      >
        {invLoading ? (
          <Spinner />
        ) : inventory.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No items in this store
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                <th className="text-left pb-2">Item No</th>
                <th className="text-left pb-2">Name</th>
                <th className="text-left pb-2">Category</th>
                <th className="text-left pb-2">Qty</th>
                <th className="text-left pb-2">Min</th>
                <th className="text-left pb-2">UOM</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((i) => (
                <tr key={i.item_id} className="border-b border-slate-800">
                  <td className="py-2 font-mono text-emerald-400 text-xs">
                    {i.item_no}
                  </td>
                  <td className="py-2 text-white">{i.item_name}</td>
                  <td className="py-2 text-slate-400 text-xs">
                    {i.category || "—"}
                  </td>
                  <td
                    className={`py-2 font-mono font-bold ${i.item_quantity <= i.min_quantity ? "text-red-400" : "text-white"}`}
                  >
                    {i.item_quantity}
                  </td>
                  <td className="py-2 text-slate-500 font-mono text-xs">
                    {i.min_quantity}
                  </td>
                  <td className="py-2 text-slate-400 text-xs">{i.item_uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
