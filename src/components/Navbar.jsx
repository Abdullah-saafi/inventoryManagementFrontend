import { NavLink, useNavigate } from "react-router-dom";
import React from "react";
import { logout } from "../services/api";
import { useAuth } from "../context/authContext";
import DatePicker from "react-multi-date-picker";
import moment from "moment-hijri";
import { useState } from "react";

const links = [
  { to: "/substore-staff", label: "Sub Store Staff", roles: ["sub-store"] },
  {
    to: "/substore-manager",
    label: "Sub Store Manager",
    roles: ["sub-store-approver"],
  },
  { to: "/mainstore", label: "Main Store", roles: ["main-store"] },
  {
    to: "/mainstore-manager",
    label: "Main Store Manager",
    roles: ["main-store-approver"],
  },
  { to: "/headoffice", label: "Head Office", roles: ["headoffice"] },
  { to: "/admin", label: "Admin Panel", roles: ["admin"] },
];

export default function Navbar() {
  const [date, setDate] = useState(new Date());
  const [logoutLoading, setLogoutLoading] = useState(false)

  const hijriDate = moment(date).format("iYYYY/iD/iMMMM");

  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  const logoutUser = async () => {
    try {
      setLogoutLoading(true)
      const response = await logout();
      if (response.data.message) console.log("successfully logout");
      setAuth({
        accessToken: null,
        username: null,
        role: null,
        storeName: null,
        store_id: null,
        message: null,
        isBlocked: false,
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
      setAuth({
        accessToken: null,
        username: null,
        role: null,
        storeName: null,
        store_id: null,
        message: null,
        isBlocked: false,
      });
      navigate("/login");
    } finally {
      setLogoutLoading(false)
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="  px-5 flex items-center justify-between h-15">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-green-500 tracking-wide text-xl">
            Baitusslam Inventory System
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-1">
          {auth.accessToken &&
            links
              .filter(
                (link) =>
                  auth.role === "super admin" || link.roles.includes(auth.role),
              )
              .map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${isActive
                      ? "bg-emerald-600 text-white"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
        </div>

        <div className="flex items-center gap-1 cursor-pointer">
          {auth.accessToken && (
            <React.Fragment>
              <button className="logout" disabled={logoutLoading} onClick={logoutUser}>
                {logoutLoading ? <div className="w-6 h-6 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" /> :
                  <span className="text-sm text-red-500 font-bold cursor-pointer">
                    Logout
                  </span>}
              </button>

              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </React.Fragment>
          )}
        </div>
        {/* Badge */}
        <div className="flex items-center ">
          <span className="text-xs text-gray-500 font-mono flex flex-col items-center ">
            <span>Assalam-o-Alaikum</span>
            <span className="font-bold text-md">{auth.username}</span>
            <span className="font-medium text-xs border bg-gray-100 border-gray-200 rounded">
              {auth.role}
            </span>
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="date text-xs text-gray-500 font-mono flex flex-col items-center ">
          <p>Gregorian: {date.toDateString()}</p>
          <p>Hijri: {hijriDate}</p>
        </div>
      </div>
    </nav>
  );
}
