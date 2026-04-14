export default function SubStoreHeader({ username, pendingGRN, onNewRequest }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-black text-gray-900">{username}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage requests, track inventory, and Request from Main Store.
        </p>
        {pendingGRN > 0 && (
          <div className="mt-1 flex items-center gap-2 text-xs text-blue-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
            {pendingGRN} delivery{pendingGRN > 1 ? "ies" : ""} waiting for your
            confirmation
          </div>
        )}
      </div>
      <button
        onClick={onNewRequest}
        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
      >
        نئی درخواست
      </button>
    </div>
  );
}
