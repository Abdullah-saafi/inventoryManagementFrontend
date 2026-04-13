export default function SubStoreFilters({
  filterStatus,
  setFilterStatus,
  filterStore,
  setFilterStore,
  role,
  subStores,
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
      >
        <option value="">تمام حالتیں</option>
        <option value="PENDING">زیرِ التواء</option>
        <option value="APPROVED">منظور شدہ</option>
        <option value="REJECTED">مسترد شدہ</option>
        <option value="FULFILLED">مکمل کیا گیا</option>
        <option value="RECEIVED">وصول ہو گیا</option>
        <option value="DISPUTED">متنازع</option>
      </select>
      {role === "super admin" && (
        <select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">تمام اسٹورز</option>
          {subStores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.store_name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
