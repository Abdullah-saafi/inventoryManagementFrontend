import { useState, useEffect } from "react";
import API, { getUsers, userStatus } from "../services/api";
import { ROLES, ROLE_LABELS } from "../services/constants";
import useErrorHandler from "./useErrorHandler";

export default function AllUsersTab({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [message, setMessage] = useState("")

  const handleError = useErrorHandler()

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await getUsers()
      setUsers(response.data || [])
    } catch (error) {
      const msg = handleError(error, "Failed to get users")
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadUsers();
  }, []);

  const handleAction = async (id, currentStatus) => {
    try {
      setLoading(true);
      const toggledStatus = !currentStatus;

      const response = await userStatus({ id, status: toggledStatus });
      console.log("Response Status Check:", response.status);

      if (response.status === 200) {
        await loadUsers();
        console.log("Users re-fetched successfully");
      }
    } catch (error) {
      const msg = handleError(error, "Failed to do action");
      setMessage(msg)
    } finally {
      setLoading(false);
    }
  };

  const uniqueStoreNames = [
    ...new Set(users.map((u) => u.store_name).filter(Boolean)),
  ].sort();

  const displayed = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStore = !storeFilter || u.store_name === storeFilter;
    return matchSearch && matchRole && matchStore;
  });

  const hasFilters = search || roleFilter || storeFilter;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Stores</option>
          {uniqueStoreNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setRoleFilter(""); setStoreFilter(""); }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded"
          >
            Clear
          </button>
        )}
        <button
          onClick={loadUsers}
          className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto"
        >
          ↻ Refresh
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg border flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300
    ${message.toLowerCase().includes("success") || message.toLowerCase().includes("activated")
            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
            : "bg-red-50 border-red-100 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <p className="text-xs font-extrabold uppercase tracking-tight">{message}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Name", "Email", "Role", "Store", "Status", "Created", "Action"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              displayed.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${!u.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3 text-gray-800 font-semibold">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 border border-gray-200 text-gray-600 text-xs font-mono px-2 py-0.5 rounded">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{u.store_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${u.is_active ? "text-emerald-600" : "text-red-500"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleAction(u.id, u.is_active)}
                      className={`text-xs font-semibold px-3 py-1 rounded border transition-colors disabled:opacity-40
                        ${u.is_active
                          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        }`}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-gray-400 text-xs">
        {displayed.length} user{displayed.length !== 1 ? "s" : ""} shown
      </div>
    </div>
  );
}