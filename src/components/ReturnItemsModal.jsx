const ReturnItemsModal = ({ setReturnItems }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/30"
                onClick={() => {
                    setReturnItems(false)
                }}
            />
            <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    {/* <h2 className="text-gray-900 font-bold">
                        {action === "Approve" ? `Approve — ${approveModal.request_no}` : `Reject — ${rejectModal.request_no}`}
                    </h2> */}
                    <button
                        onClick={() => {
                            setReturnItems(false)
                        }}
                        className="text-gray-400 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                            Your Name *
                        </label>
                        <input
                            value={action === "Approve" ? approverName : rejecterName}
                            readOnly
                            onChange={(e) => {
                                { action === "Approve" ? setApproverName(e.target.value) : setRejecterName(e.target.value) }
                            }}
                            placeholder="Manager name"
                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
                        />
                    </div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
                        Adjust quantities if needed
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-400 text-xs">
                                <th className="text-left pb-2">Item</th>
                                <th className="text-center pb-2">Requested</th>
                                <th className="text-center pb-2">Approve Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editedItems.map((i, idx) => (
                                <tr
                                    key={i.request_item_id}
                                    className="border-b border-gray-100"
                                >
                                    <td className="py-2">
                                        <div className="text-gray-800 text-sm">
                                            {i.item_name}
                                        </div>
                                        <div className="text-gray-400 text-xs font-mono">
                                            {i.item_no} · {i.item_uom}
                                        </div>
                                    </td>
                                    <td className="py-2 font-mono text-gray-500 text-center">
                                        {i.requested_qty}
                                    </td>
                                    <td className="py-2 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            value={i.approved_qty}
                                            onChange={(e) => {
                                                const u = [...editedItems];
                                                u[idx] = {
                                                    ...u[idx],
                                                    approved_qty: +e.target.value,
                                                };
                                                setEditedItems(u);
                                            }}
                                            className="w-20 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-800 text-sm text-center focus:outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default ReturnItemsModal