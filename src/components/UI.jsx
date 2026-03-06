// // ── Status Badge ─────────────────────────────────────────
// export function StatusBadge({ status }) {
//   const map = {
//     PENDING: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
//     APPROVED: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
//     REJECTED: "bg-red-500/20 text-red-400 border border-red-500/30",
//     FULFILLED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
//   };
//   return (
//     <span
//       className={`px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider ${map[status] || "bg-slate-700 text-slate-400"}`}
//     >
//       {status}
//     </span>
//   );
// }

// // ── Store Type Badge ──────────────────────────────────────
// export function StoreTypeBadge({ type }) {
//   const map = {
//     HEAD_OFFICE: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
//     MAIN_STORE:
//       "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
//     SUB_STORE: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
//   };
//   return (
//     <span
//       className={`px-2 py-0.5 rounded text-xs font-semibold ${map[type] || "bg-slate-700 text-slate-400"}`}
//     >
//       {type?.replace("_", " ")}
//     </span>
//   );
// }

// // ── Stat Card ─────────────────────────────────────────────
// export function StatCard({ label, value, sub, color = "emerald", icon }) {
//   const colors = {
//     emerald: "border-emerald-500/30 bg-emerald-500/5",
//     amber: "border-amber-500/30 bg-amber-500/5",
//     blue: "border-blue-500/30 bg-blue-500/5",
//     red: "border-red-500/30 bg-red-500/5",
//     violet: "border-violet-500/30 bg-violet-500/5",
//     sky: "border-sky-500/30 bg-sky-500/5",
//   };
//   const textColors = {
//     emerald: "text-emerald-400",
//     amber: "text-amber-400",
//     blue: "text-blue-400",
//     red: "text-red-400",
//     violet: "text-violet-400",
//     sky: "text-sky-400",
//   };
//   return (
//     <div className={`rounded-lg border p-4 ${colors[color]}`}>
//       <div className="flex items-center justify-between mb-2">
//         <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
//           {label}
//         </span>
//         {icon && <span className="text-lg">{icon}</span>}
//       </div>
//       <div className={`text-2xl font-black font-mono ${textColors[color]}`}>
//         {value ?? "—"}
//       </div>
//       {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
//     </div>
//   );
// }

// // ── Page Header ───────────────────────────────────────────
// export function PageHeader({ title, subtitle, action }) {
//   return (
//     <div className="flex items-start justify-between mb-6">
//       <div>
//         <h1 className="text-xl font-black text-white tracking-tight">
//           {title}
//         </h1>
//         {subtitle && (
//           <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
//         )}
//       </div>
//       {action && <div>{action}</div>}
//     </div>
//   );
// }

// // ── Table ─────────────────────────────────────────────────
// export function Table({ headers, children, empty = "No data found." }) {
//   return (
//     <div className="overflow-x-auto rounded-lg border border-slate-700">
//       <table className="w-full text-sm">
//         <thead>
//           <tr className="bg-slate-800 border-b border-slate-700">
//             {headers.map((h) => (
//               <th
//                 key={h}
//                 className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
//               >
//                 {h}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {children || (
//             <tr>
//               <td
//                 colSpan={headers.length}
//                 className="text-center py-12 text-slate-500"
//               >
//                 {empty}
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // ── Table Row ─────────────────────────────────────────────
// export function TR({ children, onClick }) {
//   return (
//     <tr
//       onClick={onClick}
//       className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${onClick ? "cursor-pointer" : ""}`}
//     >
//       {children}
//     </tr>
//   );
// }

// export function TD({ children, className = "" }) {
//   return (
//     <td className={`px-4 py-3 text-slate-300 ${className}`}>{children}</td>
//   );
// }

// // ── Button ────────────────────────────────────────────────
// export function Btn({
//   children,
//   onClick,
//   variant = "primary",
//   size = "md",
//   disabled,
//   type = "button",
//   className = "",
// }) {
//   const variants = {
//     primary: "bg-emerald-600 hover:bg-emerald-500 text-white",
//     danger: "bg-red-600 hover:bg-red-500 text-white",
//     ghost: "bg-slate-700 hover:bg-slate-600 text-slate-200",
//     outline: "border border-slate-600 hover:bg-slate-800 text-slate-300",
//     amber: "bg-amber-600 hover:bg-amber-500 text-white",
//     blue: "bg-blue-600 hover:bg-blue-500 text-white",
//   };
//   const sizes = {
//     sm: "px-3 py-1.5 text-xs",
//     md: "px-4 py-2 text-sm",
//     lg: "px-5 py-2.5 text-base",
//   };
//   return (
//     <button
//       type={type}
//       onClick={onClick}
//       disabled={disabled}
//       className={`rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
//     >
//       {children}
//     </button>
//   );
// }

// // ── Modal ─────────────────────────────────────────────────
// export function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div
//         className="absolute inset-0 bg-black/70 backdrop-blur-sm"
//         onClick={onClose}
//       />
//       <div
//         className={`relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}
//       >
//         <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
//           <h2 className="text-white font-bold text-base">{title}</h2>
//           <button
//             onClick={onClose}
//             className="text-slate-400 hover:text-white text-xl leading-none"
//           >
//             ×
//           </button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// }

// // ── Form Field ────────────────────────────────────────────
// export function Field({ label, required, children, hint }) {
//   return (
//     <div className="flex flex-col gap-1">
//       <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
//         {label} {required && <span className="text-red-400">*</span>}
//       </label>
//       {children}
//       {hint && <span className="text-slate-500 text-xs">{hint}</span>}
//     </div>
//   );
// }

// export function Input({ ...props }) {
//   return (
//     <input
//       {...props}
//       className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors w-full"
//     />
//   );
// }

// export function Select({ children, ...props }) {
//   return (
//     <select
//       {...props}
//       className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
//     >
//       {children}
//     </select>
//   );
// }

// export function Textarea({ ...props }) {
//   return (
//     <textarea
//       {...props}
//       className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors w-full resize-none"
//     />
//   );
// }

// // ── Loading / Error ───────────────────────────────────────
// export function Spinner() {
//   return (
//     <div className="flex items-center justify-center py-16">
//       <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
//     </div>
//   );
// }

// export function ErrorMsg({ message }) {
//   return (
//     <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
//       ⚠ {message}
//     </div>
//   );
// }

// export function Toast({ message, type = "success", onClose }) {
//   const styles = {
//     success: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
//     error: "bg-red-500/20 border-red-500/40 text-red-300",
//     info: "bg-blue-500/20 border-blue-500/40 text-blue-300",
//   };
//   return (
//     <div
//       className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium ${styles[type]}`}
//     >
//       <span>{message}</span>
//       <button onClick={onClose} className="opacity-60 hover:opacity-100">
//         ×
//       </button>
//     </div>
//   );
// }
