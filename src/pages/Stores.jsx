import { useEffect, useState } from "react";
import {
  getStores,
  createStore,
  updateStore,
  getStoreById,
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

  // Search
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  // Create / Edit
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Inventory modal
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

  // ── Search by Store ID ──────────────────────────────────
  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const r = await getStoreById(searchId.trim());
      setSearchResult(r.data.data);
    } catch {
      setSearchError("No store found with that ID.");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchId("");
    setSearchResult(null);
    setSearchError("");
  };

  // ── Create / Edit ───────────────────────────────────────
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

  // ── Inventory ───────────────────────────────────────────
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
      {/* ── Search Bar ─────────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-5">
        <div className="flex gap-2">
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Paste store UUID here… e.g. 00000000-0000-0000-0000-000000000002"
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <Btn onClick={handleSearch} disabled={searching || !searchId.trim()}>
            {searching ? "Searching…" : "Search"}
          </Btn>
          {(searchResult || searchError) && (
            <Btn variant="ghost" onClick={clearSearch}>
              Clear
            </Btn>
          )}
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="mt-3 text-red-400 text-sm">⚠ {searchError}</div>
        )}

        {/* Search Result */}
        {searchResult && (
          <div className="mt-4 bg-slate-900 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-white font-bold text-base">
                  {searchResult.store_name}
                </div>
                <div className="text-slate-400 text-xs font-mono mt-0.5">
                  {searchResult.store_id}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StoreTypeBadge type={searchResult.store_type} />
                <span
                  className={`text-xs font-semibold ${searchResult.is_active ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {searchResult.is_active ? "● Active" : "● Inactive"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { label: "Store Code", value: searchResult.store_code },
                {
                  label: "Store Type",
                  value: searchResult.store_type?.replace("_", " "),
                },
                { label: "Phone", value: searchResult.phone || "—" },
                { label: "Address", value: searchResult.address || "—" },
                {
                  label: "Created",
                  value: new Date(searchResult.created_at).toLocaleDateString(),
                },
                {
                  label: "Updated",
                  value: new Date(searchResult.updated_at).toLocaleDateString(),
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800 rounded p-2">
                  <div className="text-slate-500 text-xs mb-1">{label}</div>
                  <div className="text-white text-sm font-medium">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => openInventory(searchResult)}
              >
                View Inventory
              </Btn>
              <Btn
                size="sm"
                variant="outline"
                onClick={() => openEdit(searchResult)}
              >
                Edit Store
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* ── Stores Table ───────────────────────────────── */}
      <Table headers={["Code", "Name", "Type", "Address", "Phone", "Status"]}>
        {stores.map((s) => (
          <TR key={s.store_id}>
            <TD>
              <span className="font-mono text-emerald-400 text-xs">
                {s.store_code}
              </span>
            </TD>
            <TD>
              <div>
                <div className="font-semibold text-white text-sm">
                  {s.store_name}
                </div>
                <div className="text-slate-600 text-xs font-mono truncate max-w-[160px]">
                  {s.store_id}
                </div>
              </div>
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
                {s.is_active ? "● Active" : "● Inactive"}
              </span>
            </TD>
          </TR>
        ))}
      </Table>
    </div>
  );
}
