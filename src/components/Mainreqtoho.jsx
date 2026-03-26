import { useEffect, useState } from "react";
import { getItems, createRequest } from "../services/api";
import { useAuth } from "../context/authContext";

const EMPTY_HO_ITEM = {
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
};

export default function MainReqToHO({
  mainStores,
  headOffices,
  onSubmitted,
  showToast,
}) {

  const {auth} = useAuth()

  const [creating, setCreating] = useState(false);
  const [storeItems, setStoreItems] = useState([]);
  const [hoForm, setHoForm] = useState({
    from_store_id: "",
    to_store_id: "",
    requested_by_name: auth.username,
    notes: "",
    items: [{ ...EMPTY_HO_ITEM }],
  });

  useEffect(() => {
    if (hoForm.from_store_id) {
      getItems({ store_id: hoForm.from_store_id })
        .then((r) => setStoreItems(r.data.data || []))
        .catch(() => setStoreItems([]));
    } else {
      setStoreItems([]);
    }
  }, [hoForm.from_store_id]);

  const addLine = () =>
    setHoForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_HO_ITEM }] }));

  const removeLine = (idx) =>
    setHoForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const updateLine = (idx, field, value) => {
    setHoForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "selected_item_no") {
        if (value) {
          const found = storeItems.find((i) => i.item_no === value);
          if (found) {
            items[idx].item_no = found.item_no;
            items[idx].item_name = found.item_name;
            items[idx].item_uom = found.item_uom;
            items[idx].item_search = found.item_no + " — " + found.item_name;
          }
        } else {
          items[idx].item_no = items[idx].item_name = items[idx].item_uom = "";
        }
      }
      return { ...f, items };
    });
  };

  const handleSubmit = async () => {
    const { from_store_id, to_store_id, requested_by_name, items } = hoForm;
    if (
      !from_store_id ||
      !to_store_id ||
      !requested_by_name ||
      items.some(
        (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
      )
    )
      return showToast("Please fill all required fields", "error");

    setCreating(true);
    try {
      await createRequest({
        ...hoForm,
        direction: "MAIN_TO_HO",
        items: items.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
      });
      showToast("Request submitted to Head Office");
      setHoForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        items: [{ ...EMPTY_HO_ITEM }],
      });
      onSubmitted(); // switch to ho-status tab + reload
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to submit", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h2 className="text-gray-900 font-semibold text-base">
          New Request to Head Office
        </h2>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Store selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
              From (Main Store) *
            </label>
            <select
              value={hoForm.from_store_id}
              onChange={(e) =>
                setHoForm((f) => ({ ...f, from_store_id: e.target.value }))
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
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
              To (Head Office) *
            </label>
            <select
              value={hoForm.to_store_id}
              onChange={(e) =>
                setHoForm((f) => ({ ...f, to_store_id: e.target.value }))
              }
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select Head Office</option>
              {headOffices.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requested By */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Requested By *
          </label>
          <input
            value={hoForm.requested_by_name}
            readOnly
            onChange={(e) =>
              setHoForm((f) => ({ ...f, requested_by_name: e.target.value }))
            }
            placeholder="Your name"
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Notes
          </label>
          <textarea
            value={hoForm.notes}
            onChange={(e) =>
              setHoForm((f) => ({ ...f, notes: e.target.value }))
            }
            rows={2}
            placeholder="Optional reason"
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-semibold uppercase">
              Items
            </span>
            <button
              onClick={addLine}
              className="text-xs text-emerald-600 hover:text-emerald-500 border border-gray-300 rounded px-2 py-1"
            >
              + Add Row
            </button>
          </div>
          <div className="space-y-3">
            {hoForm.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Item {idx + 1}
                  </span>
                  <button
                    onClick={() => removeLine(idx)}
                    disabled={hoForm.items.length === 1}
                    className="text-red-400 hover:text-red-500 disabled:opacity-30 text-lg font-bold leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Catalogue search */}
                <div className="mb-3">
                  <label className="text-gray-500 text-xs mb-1 block">
                    Select from catalogue
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
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                    />
                    {item._showDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        <div
                          className="px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer"
                          onMouseDown={() => {
                            updateLine(idx, "selected_item_no", "");
                            updateLine(idx, "item_search", "");
                            updateLine(idx, "_showDropdown", false);
                          }}
                        >
                          — Not listed / enter manually —
                        </div>
                        {storeItems
                          .filter((si) => {
                            const q = (item.item_search || "").toLowerCase();
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
                                updateLine(idx, "selected_item_no", si.item_no);
                                updateLine(
                                  idx,
                                  "item_search",
                                  si.item_no + " — " + si.item_name,
                                );
                                updateLine(idx, "_showDropdown", false);
                              }}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-t border-gray-100 ${item.selected_item_no === si.item_no ? "bg-emerald-50" : ""}`}
                            >
                              <span className="font-mono text-emerald-600 text-xs">
                                {si.item_no}
                              </span>
                              <span className="text-gray-800 text-xs ml-2">
                                {si.item_name}
                              </span>
                              <span className="text-gray-400 text-xs ml-2">
                                · Stock:{" "}
                                {parseFloat(si.item_quantity).toFixed(0)}{" "}
                                {si.item_uom}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-gray-400 text-xs">item details</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-2">
                    <label className="text-gray-500 text-xs mb-1 block">
                      Item No *
                    </label>
                    <input
                      value={item.item_no}
                      onChange={(e) =>
                        updateLine(idx, "item_no", e.target.value)
                      }
                      placeholder="ITM-001"
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-gray-500 text-xs mb-1 block">
                      Item Name *
                    </label>
                    <input
                      value={item.item_name}
                      onChange={(e) =>
                        updateLine(idx, "item_no", e.target.value)
                      }
                      placeholder="Full item name"
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-500 text-xs mb-1 block">
                      UOM *
                    </label>
                    <input
                      value={item.item_uom}
                      onChange={(e) =>
                        updateLine(idx, "item_uom", e.target.value)
                      }
                      placeholder="pcs / kg…"
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-500 text-xs mb-1 block">
                      Qty *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.requested_qty}
                      onChange={(e) =>
                        updateLine(idx, "requested_qty", +e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={creating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40"
          >
            {creating ? "Submitting..." : "Submit Request to Head Office"}
          </button>
        </div>
      </div>
    </div>
  );
}
