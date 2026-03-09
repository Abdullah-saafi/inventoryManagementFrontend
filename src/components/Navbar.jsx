import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import { useAuth } from "../context/authContext";

const links = [
  { to: "/substore-staff", label: "Sub Store Staff", role: "sub-store" },
  {
    to: "/substore-manager",
    label: "Sub Store Manager",
    role: "sub-store-approver",
  },
  { to: "/mainstore", label: "Main Store", role: "main-store" },
  {
    to: "/mainstoreapprover",
    label: "Main Store Manager ",
    role: "main-store-approver",
  },

  { to: "/headoffice", label: "Head Office", role: "headoffice" },
];

export default function Navbar() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  const logoutUser = async () => {
    try {
      const response = await logout();
      if (response.data.message) console.log("successfully logout");
      setAuth({
        accessToken: null,
        username: null,
        role: null,
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
      setAuth({ accessToken: null, username: null, role: null });
      navigate("/login");
    }
  };
  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-red-500 tracking-wide">
            Baitusslam Inventory System
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-1">
          {auth.accessToken &&
            links
              .filter(
                (link) =>
                  link.role === auth.role || auth.role === "super admin",
              )
              .map(({ to, label }) => (
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

        <div className="flex items-center gap-2">
          {auth.accessToken && (
            <>
              <button className="logout" onClick={logoutUser}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#000000"
                >
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
                </svg>
                <span>Logout</span>
              </button>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </>
          )}
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
