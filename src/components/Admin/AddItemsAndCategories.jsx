import { useEffect, useState } from "react";
import { inputClass, labelClass } from "../../services/constants";
import { createItem, getStores } from "../../services/api";
import useErrorHandler from "../useErrorHandler";
import Toast from "../Toast";

const EMPTY_NEW_ITEM = {
    item_no: "",
    item_name: "",
    item_uom: "",
    category: "",
    item_quantity: "",
    min_quantity: "",
    store_id: "",
    item_type: "",
};

const AddItemsAndCategories = () => {

    const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
    const [mainStores, setMainStores] = useState([]);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleError = useErrorHandler();

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await getStores(),
                stores = res.data.data || res.data;
            if (Array.isArray(stores)) {
            setMainStores(stores.filter((s) => s.store_type === "MAIN_STORE"));
        }
        } catch (error) {
            const msg = handleError(error, "Failed to load data");
            setToast({ message: msg, type: "error" });
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        fetchData();
        regenerateItemNo()
    }, []);

    const generateRandomItemNo = () =>
        `ITM-${Math.floor(Math.random() * 900) + 100}`;

    const regenerateItemNo = () =>
        setNewItem((f) => ({ ...f, item_no: generateRandomItemNo() }));

    const handleSaveItem = async () => {
        console.log("Validation Check - Item No:", newItem.item_no);
    console.log("Validation Check - Store ID:", newItem.store_id);

    const { item_no, item_name, item_uom, store_id } = newItem;
        if (
            !newItem.item_no ||
            !newItem.item_name ||
            !newItem.item_uom ||
            !newItem.store_id
        )
            return setToast({
                message: "Item No, Name, UOM and Store are required",
                type: "error",
            });
        setLoading(true);
        try {
            await createItem(newItem);
            setToast({ message: "Item added successfully", type: "success" });
        } catch (e) {
            const msg = handleError(e, "Failed to add item");
            setToast({ message: msg, type: "error" });
        } finally{
            setLoading(false)
        }
    };



    return (
        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h3 className="text-gray-900 font-bold text-base">
                        Add New Item
                    </h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                    {loading ?
                        (<div className="flex justify-center">
                            <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                        </div>) : (
                            <>

                                <div>
                                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                        اشیاء نمبر{" "}
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
                                            onClick={() => regenerateItemNo()}
                                            title="Generate new number"
                                            className="px-3 py-2 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-sm"
                                        >
                                            ↻
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                        اشیاء کا نام
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
                                <div>
                                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                        آئٹم کی قسم
                                    </label>
                                    <select
                                        value={newItem.item_type}
                                        onChange={(e) => {
                                            const selectedType = e.target.value
                                            setNewItem((f) => ({
                                                ...f,
                                                item_type : selectedType,
                                                item_uom : selectedType === "non-consumeable" ? "" : f.item_uom
                                            }))
                                        }}
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value=""> آئٹم کی قسم</option>
                                        <option value="consumeable">Consumeable</option>
                                        <option value="non-consumeable"> Non-Consumeable</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="UOM" className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                            UOM *
                                        <input
                                            value={newItem.item_uom}
                                            id="UOM"
                                            disabled={newItem.item_type === "non-consumeable"}
                                            onChange={(e) =>
                                                setNewItem((f) => ({ ...f, item_uom: e.target.value }))
                                            }
                                            placeholder="pcs / kg / box…"
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500d disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                            </label>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                            زمرہ
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
                                            ابتدائی مقدار
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
                                            کم از کم اسٹاک
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
                                        اسٹور*
                                    </label>
                                    <select
                                        value={newItem.store_id}
                                        onChange={(e) =>
                                            setNewItem((f) => ({ ...f, store_id: e.target.value }))
                                        }
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="">اسٹور منتخب کریں</option>
                                        {mainStores.map((s) => (
                                            <option key={s.store_id} value={s.store_id}>
                                                {s.store_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )
                    }
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
                    <button
                        onClick={handleSaveItem}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all"
                    >
                        {loading ? "Saving..." : "Save Item"}
                    </button>
                </div>
            </div>
            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    )
}

export default AddItemsAndCategories