export default function CreateRequestModal({
  form,
  setForm,
  mainStores,
  storeItems,
  onClose,
  onSubmit,
  addLine,
  removeLine,
  updateLine,
  creating,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold">نئی اشیاء کی درخواست</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                درخواست کنندہ
              </label>
              <input
                value={form.requested_by_name}
                readOnly
                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                بھیجیں(مرکزی اسٹور)
              </label>
              {mainStores.length === 1 ? (
                <input
                  value={mainStores[0].store_name}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
                />
              ) : (
                <select
                  value={form.to_store_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, to_store_id: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Main Store</option>
                  {mainStores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
              ہدایت یا نوٹس
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Optional reason or note"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-xs font-semibold uppercase">
                Items
              </span>
              <button
                type="button"
                onClick={addLine}
                className="text-xs text-emerald-600 hover:text-emerald-500 border border-gray-300 rounded px-2 py-1"
              >
                + Add Row
              </button>
            </div>

            {!form.to_store_id ? (
              <div className="text-gray-400 text-xs text-center py-6 border border-dashed border-gray-300 rounded-lg">
                Select a Main Store first to load available items
              </div>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        Item {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={form.items.length === 1}
                        className="text-red-400 hover:text-red-500 disabled:opacity-30 text-lg font-bold leading-none"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mb-3">
                      <label className="text-gray-500 text-xs mb-1 block">
                        Select from catalogue ({storeItems.length} items
                        available)
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          value={item.item_search}
                          onChange={(e) => {
                            updateLine(idx, "item_search", e.target.value);
                            updateLine(idx, "_showDropdown", true);
                          }}
                          onFocus={() => updateLine(idx, "_showDropdown", true)}
                          onBlur={() =>
                            setTimeout(
                              () => updateLine(idx, "_showDropdown", false),
                              150,
                            )
                          }
                          placeholder="Search by item name or number…"
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                        />
                        {item._showDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {storeItems
                              .filter((si) => {
                                const q = (
                                  item.item_search || ""
                                ).toLowerCase();
                                return (
                                  !q ||
                                  si.item_no.toLowerCase().includes(q) ||
                                  si.item_name.toLowerCase().includes(q)
                                );
                              })
                              .map((si) => (
                                <div
                                  key={si.item_id}
                                  onMouseDown={() => {
                                    updateLine(
                                      idx,
                                      "selected_item_no",
                                      si.item_no,
                                    );
                                    updateLine(
                                      idx,
                                      "item_search",
                                      `${si.item_no} — ${si.item_name}`,
                                    );
                                    updateLine(idx, "_showDropdown", false);
                                  }}
                                  className={`px-3 py-2 cursor-pointer hover:bg-emerald-50 border-t border-gray-100 flex items-center justify-between ${item.selected_item_no === si.item_no ? "bg-emerald-50" : ""}`}
                                >
                                  <div>
                                    <span className="font-mono text-emerald-600 text-xs font-bold">
                                      {si.item_no}
                                    </span>
                                    <span className="text-gray-700 text-xs ml-2">
                                      {si.item_name}
                                    </span>
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {parseFloat(si.item_quantity).toFixed(0)}{" "}
                                    {si.item_uom}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-gray-400 text-xs">
                        item details
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                          Item No
                        </label>
                        <input
                          value={item.item_no}
                          readOnly
                          onChange={(e) =>
                            updateLine(idx, "item_no", e.target.value)
                          }
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                          Name
                        </label>
                        <input
                          value={item.item_name}
                          readOnly
                          onChange={(e) =>
                            updateLine(idx, "item_name", e.target.value)
                          }
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                          UOM
                        </label>
                        <input
                          value={item.item_uom}
                          readOnly
                          onChange={(e) =>
                            updateLine(idx, "item_uom", e.target.value)
                          }
                          placeholder="e.g. KG"
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block text-emerald-600">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={item.requested_qty}
                          onChange={(e) =>
                            updateLine(
                              idx,
                              "requested_qty",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500 font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !form.to_store_id}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-8 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {creating ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
