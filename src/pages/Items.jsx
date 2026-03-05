import { useEffect, useState } from "react";
import {
  getItems,
  getStores,
  createItem,
  updateItem,
  deleteItem,
  getLowStock,
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
  Spinner,
  ErrorMsg,
  Toast,
  StatCard,
} from "../components/UI";

const EMPTY_FORM = {
  item_no: "",
  item_name: "",
  item_uom: "",
  item_quantity: 0,
  min_quantity: 0,
  category: "",
  description: "",
  store_id: "",
};
const UOM_OPTIONS = [
  "pcs",
  "kg",
  "g",
  "ltr",
  "ml",
  "box",
  "carton",
  "roll",
  "meter",
  "pair",
  "dozen",
  "bag",
  "pack",
  "ream",
];

export default function Items() {
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [filterStore, setFilterStore] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showLow, setShowLow] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStore) params.store_id = filterStore;
      if (filterCategory) params.category = filterCategory;
      const [itemsRes, storesRes, lowRes] = await Promise.all([
        getItems(params),
        getStores(),
        getLowStock(),
      ]);
      setItems(itemsRes.data.data);
      setStores(storesRes.data.data);
      setLowStock(lowRes.data.data);
    } catch {
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStore, filterCategory]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, store_id: stores[0]?.store_id || "" });
    setShowForm(true);
  };
  const openEdit = (i) => {
    setEditing(i);
    setForm({
      item_no: i.item_no,
      item_name: i.item_name,
      item_uom: i.item_uom,
      item_quantity: i.item_quantity,
      min_quantity: i.min_quantity,
      category: i.category || "",
      description: i.description || "",
      store_id: i.store_id,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.item_no || !form.item_name || !form.item_uom || !form.store_id)
      return;
    setSaving(true);
    try {
      if (editing) {
        await updateItem(editing.item_id, form);
        setToast({ message: "Item updated!", type: "success" });
      } else {
        await createItem(form);
        setToast({ message: "Item created!", type: "success" });
      }
      setShowForm(false);
      load();
    } catch (e) {
      setToast({
        message: e.response?.data?.message || "Error saving",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this item?")) return;
    try {
      await deleteItem(id);
      setToast({ message: "Item deactivated", type: "info" });
      load();
    } catch {
      setToast({ message: "Failed to delete", type: "error" });
    }
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const displayItems = showLow ? lowStock : items;

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} />;

  return (
    <div>
      <PageHeader
        title="Items"
        subtitle="Manage inventory items across all stores"
        action={<Btn onClick={openCreate}>+ New Item</Btn>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Items" value={items.length} color="emerald" />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          color="red"
          sub="At or below min qty"
        />
        <StatCard label="Categories" value={categories.length} color="blue" />
        <StatCard label="Stores" value={stores.length} color="violet" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="w-48"
        >
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.store_name}
            </option>
          ))}
        </Select>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-40"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Btn
          variant={showLow ? "danger" : "outline"}
          onClick={() => setShowLow(!showLow)}
        >
          {showLow ? "⚠ Low Stock Only" : "Show Low Stock"}
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            setFilterStore("");
            setFilterCategory("");
            setShowLow(false);
          }}
        >
          Reset
        </Btn>
      </div>

      <Table
        headers={[
          "Item No",
          "Name",
          "Category",
          "UOM",
          "Qty",
          "Min Qty",
          "Store",
          "Actions",
        ]}
      >
        {displayItems.map((i) => (
          <TR key={i.item_id}>
            <TD>
              <span className="font-mono text-emerald-400 text-xs">
                {i.item_no}
              </span>
            </TD>
            <TD>
              <span className="font-semibold text-white">{i.item_name}</span>
            </TD>
            <TD>
              <span className="text-xs text-slate-400">
                {i.category || "—"}
              </span>
            </TD>
            <TD>
              <span className="text-xs font-mono text-slate-300">
                {i.item_uom}
              </span>
            </TD>
            <TD>
              <span
                className={`font-mono font-bold text-sm ${i.item_quantity <= i.min_quantity ? "text-red-400" : "text-white"}`}
              >
                {i.item_quantity}
                {i.item_quantity <= i.min_quantity && (
                  <span className="text-red-400 text-xs ml-1">⚠</span>
                )}
              </span>
            </TD>
            <TD>
              <span className="font-mono text-slate-400 text-sm">
                {i.min_quantity}
              </span>
            </TD>
            <TD>
              <span className="text-xs text-slate-400">{i.store_name}</span>
            </TD>
            <TD>
              <div className="flex gap-1">
                <Btn size="sm" variant="outline" onClick={() => openEdit(i)}>
                  Edit
                </Btn>
                <Btn
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(i.item_id)}
                >
                  Del
                </Btn>
              </div>
            </TD>
          </TR>
        ))}
      </Table>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Item" : "Create Item"}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item No" required>
              <Input
                value={form.item_no}
                onChange={(e) => setForm({ ...form, item_no: e.target.value })}
                placeholder="ITM-0013"
                disabled={!!editing}
              />
            </Field>
            <Field label="UOM" required hint="kg, pcs, ltr, box…">
              <Select
                value={form.item_uom}
                onChange={(e) => setForm({ ...form, item_uom: e.target.value })}
              >
                <option value="">Select UOM</option>
                {UOM_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Item Name" required>
            <Input
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              placeholder="Office Paper A4"
            />
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Stationery"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input
                type="number"
                value={form.item_quantity}
                onChange={(e) =>
                  setForm({ ...form, item_quantity: +e.target.value })
                }
                min="0"
              />
            </Field>
            <Field label="Min Quantity" hint="Reorder threshold">
              <Input
                type="number"
                value={form.min_quantity}
                onChange={(e) =>
                  setForm({ ...form, min_quantity: +e.target.value })
                }
                min="0"
              />
            </Field>
          </div>
          <Field label="Store" required>
            <Select
              value={form.store_id}
              onChange={(e) => setForm({ ...form, store_id: e.target.value })}
              disabled={!!editing}
            >
              <option value="">Select Store</option>
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional notes"
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
