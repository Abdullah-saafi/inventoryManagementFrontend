import { useState } from "react";
import { createItem } from "../services/api";

const EMPTY_NEW_ITEM = {
  item_no: "",
  item_name: "",
  item_uom: "",
  category: "",
  item_quantity: "",
  min_quantity: "",
  store_id: "",
};

const generateRandomItemNo = () =>
  `ITM-${Math.floor(Math.random() * 900) + 100}`;

export default function MainAllItems({
  allItems,
  mainStores,
  onRefresh,
  showToast,
}) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [savingItem, setSavingItem] = useState(false);

  const openAddItem = () => {
    setNewItem({ ...EMPTY_NEW_ITEM, item_no: generateRandomItemNo() });
    setShowAddItem(true);
  };

  const regenerateItemNo = () =>
    setNewItem((f) => ({ ...f, item_no: generateRandomItemNo() }));

  const handleSaveItem = async () => {
    if (
      !newItem.item_no ||
      !newItem.item_name ||
      !newItem.item_uom ||
      !newItem.store_id
    )
      return showToast("Item No, Name, UOM and Store are required", "error");
    setSavingItem(true);
    try {
      await createItem(newItem);
      showToast("Item added successfully");
      setShowAddItem(false);
      onRefresh();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to add item", "error");
    } finally {
      setSavingItem(false);
    }
  };

  // Group raw rows by item_no, split main vs sub qty
  const groupedItems = Object.values(
    allItems.reduce((acc, row) => {
      const qty = parseFloat(row.item_quantity || 0);
      const isMain = row.store_type === "MAIN_STORE";
      const isSub = row.store_type === "SUB_STORE";
      if (!acc[row.item_no]) {
        acc[row.item_no] = {
          ...row,
          total_qty: qty,
          main_qty: isMain ? qty : 0,
          sub_qty: isSub ? qty : 0,
        };
      } else {
        acc[row.item_no].total_qty += qty;
        if (isMain) acc[row.item_no].main_qty += qty;
        if (isSub) acc[row.item_no].sub_qty += qty;
      }
      return acc;
    }, {}),
  );

  const categories = [
    ...new Set(allItems.map((i) => i.category).filter(Boolean)),
  ];

  const filteredItems = groupedItems.filter((i) => {
    const q = search.toLowerCase();
    return (
      (!search ||
        i.item_name.toLowerCase().includes(q) ||
        i.item_no.toLowerCase().includes(q)) &&
      (!filterCategory || i.category === filterCategory)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div>
      {/* Filters + Add button */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name or item number..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500 w-64"
        />
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {(search || filterCategory) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterCategory("");
              setCurrentPage(1);
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded"
          >
            Clear
          </button>
        )}
        <button
          onClick={openAddItem}
          className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> Add Item
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "Item No",
                "Name",
                "Category",
                "UOM",
                "Main Store Stock",
                "Sent to Sub-Stores",
                "Remaining Stock",
                "Min Stock",
                "Status",
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
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  No items found.
                </td>
              </tr>
            ) : (
              paginatedItems.map((i) => {
                const isLow = i.main_qty <= parseFloat(i.min_quantity || 0);
                return (
                  <tr
                    key={i.item_no}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-600 text-xs">
                        {i.item_no}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-semibold">
                      {i.item_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {i.category || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {i.item_uom}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono font-bold ${isLow ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {Number(i.main_qty).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                      {Number(i.sub_qty).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs font-bold ${i.main_qty - i.sub_qty <= 0 ? "text-red-500" : "text-gray-700"}`}
                      >
                        {Number(i.main_qty - i.sub_qty).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                      {i.min_quantity ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${isLow ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {isLow ? "Low" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-gray-400 text-xs">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of{" "}
            {filteredItems.length} items
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2,
              )
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e-${i}`}
                    className="px-2 py-1 text-xs text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-2.5 py-1 text-xs rounded border font-mono ${currentPage === p ? "bg-emerald-600 border-emerald-600 text-white font-bold" : "border-gray-300 text-gray-500 hover:bg-gray-100"}`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              Next ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-gray-900 font-bold text-base">
                Add New Item
              </h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Item No{" "}
                  <span className="text-gray-400 font-normal normal-case">
                    (auto-generated, editable)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={newItem.item_no}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, item_no: e.target.value }))
                    }
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-emerald-600 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={regenerateItemNo}
                    title="Generate new number"
                    className="px-3 py-2 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-sm"
                  >
                    ↻
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Item Name *
                </label>
                <input
                  value={newItem.item_name}
                  onChange={(e) =>
                    setNewItem((f) => ({ ...f, item_name: e.target.value }))
                  }
                  placeholder="e.g. Surgical Gloves"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    UOM *
                  </label>
                  <input
                    value={newItem.item_uom}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, item_uom: e.target.value }))
                    }
                    placeholder="pcs / kg / box…"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <input
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="e.g. Medical"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.item_quantity}
                    onChange={(e) =>
                      setNewItem((f) => ({
                        ...f,
                        item_quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.min_quantity}
                    onChange={(e) =>
                      setNewItem((f) => ({
                        ...f,
                        min_quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  Store *
                </label>
                <select
                  value={newItem.store_id}
                  onChange={(e) =>
                    setNewItem((f) => ({ ...f, store_id: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select store</option>
                  {mainStores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={savingItem}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40"
              >
                {savingItem ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
