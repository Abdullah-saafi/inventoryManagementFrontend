export default function StatusBadge({ status }) {
  const s = {
    PENDING: "bg-yellow-50 text-yellow-600 border-yellow-300",
    APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-300",
    REJECTED: "bg-red-50 text-red-600 border-red-300",
    FULFILLED: "bg-blue-50 text-blue-600 border-blue-300",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || ""}`}
    >
      {status}
    </span>
  );
}
