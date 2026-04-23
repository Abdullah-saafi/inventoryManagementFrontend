const TypeBadge = ({ hasItems, hasAssets }) => {
  if (hasItems && hasAssets)
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded px-1.5 py-0.5">
          Items
        </span>
        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded px-1.5 py-0.5">
          🖥️ Assets
        </span>
      </div>
    );
  if (hasAssets)
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded px-1.5 py-0.5">
        Consumable items
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded px-1.5 py-0.5">
      Items
    </span>
  );
};

export default TypeBadge