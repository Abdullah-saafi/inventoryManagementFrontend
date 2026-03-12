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
    to: "/mainstore-approver",
    label: "Main Store Approver",
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-bold tracking-wide">
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
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
              <button
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                onClick={logoutUser}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                  fill="currentColor"
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
          <span className="text-gray-500 font-mono text-sm text-right">
            Assalam-o-Alaikum <br />
            <span className="text-gray-800 font-semibold">{auth.username}</span>
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </nav>
  );
}
