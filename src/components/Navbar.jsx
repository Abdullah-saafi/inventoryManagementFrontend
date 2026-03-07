import { NavLink } from "react-router-dom";

const links = [
  { to: "/substore-staff", label: "Sub Store Staff" },
  { to: "/substore-manager", label: "Sub Store Manager" },
  { to: "/mainstore", label: "Main Store" },
  { to: "/headoffice", label: "Head Office" },
];

export default function Navbar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-wide">
            Baitusslam Inventory System
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            Assalam-oAlaikum
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </nav>
  );
}
