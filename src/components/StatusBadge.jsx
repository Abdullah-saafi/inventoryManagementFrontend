export default function StatusBadge({ status }) {
  const s = {
    PENDING: "bg-yellow-50 text-yellow-600 border border-yellow-300",
    APPROVED: "bg-emerald-50 text-emerald-600 border border-emerald-300",
    REJECTED: "bg-red-50 text-red-600 border border-red-300",
    FULFILLED: "bg-blue-50 text-blue-600 border border-blue-300",
    RECEIVED: "bg-teal-50 text-teal-600 border border-teal-300",
    DISPUTED: "bg-amber-50 text-amber-600 border border-amber-300",
    CLOSED: "bg-gray-100 text-gray-500 border border-gray-300",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || ""}`}
    >
      {status}
    </span>
  );
}

// className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${styles[status] || "bg-gray-50 text-gray-500 border border-gray-200"}`}