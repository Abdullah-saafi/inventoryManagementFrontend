import { useEffect, useState } from "react";
import { getStores } from "../services/api";
import API from "../services/api";

const addUser = (data) => API.post("/users/addUser", data);
const addStore = (data) => API.post("/stores", data);
const fetchUsers = (params) => API.get("/users", { params });
const toggleUser = (id) => API.patch(`/users/${id}/toggle`);
const toggleStore = (id) => API.patch(`/stores/${id}/toggle`);

const ROLE_STORE_MAP = {
  "sub-store": "SUB_STORE",
  "sub-store-approver": "SUB_STORE",
  "main-store": "MAIN_STORE",
  "main-store-approver": "MAIN_STORE",
  headoffice: "HEAD_OFFICE",
};

const ROLES = [
  { value: "sub-store", label: "Sub Store Staff" },
  { value: "sub-store-approver", label: "Sub Store Manager" },
  { value: "main-store", label: "Main Store Staff" },
  { value: "main-store-approver", label: "Main Store Manager" },
  { value: "headoffice", label: "Head Office" },
  { value: "admin", label: "Admin" },
];

const ROLE_LABELS = {
  "sub-store": "Sub Store Staff",
  "sub-store-approver": "Sub Store Manager",
  "main-store": "Main Store Staff",
  "main-store-approver": "Main Store Manager",
  headoffice: "Head Office",
  admin: "Admin",
  "super admin": "Super Admin",
};

const TABS = [
  { id: "user", label: "Add User" },
  { id: "store", label: "Add Sub Store" },
  { id: "all-users", label: "All Users" },
  { id: "all-stores", label: "All Stores" },
];

const STORE_TYPE_LABELS = {
  MAIN_STORE: "Main Store",
  SUB_STORE: "Sub Store",
  HEAD_OFFICE: "Head Office",
};

const EyeOpen = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
  >
    <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
  </svg>
);
const EyeClosed = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
  >
    <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
  </svg>
);

const inputClass =
  "w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400";
const labelClass =
  "text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1";

export default function AddUser() {
  const [tab, setTab] = useState("user");
  const [stores, setStores] = useState([]);
  const [toast, setToast] = useState(null);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "",
    store_id: "",
    password: "",
    confirmPassword: "",
  });
  const [userLoading, setUserLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [storeForm, setStoreForm] = useState({
    store_code: "",
    store_name: "",
    address: "",
    phone: "",
  });
  const [storeLoading, setStoreLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUL] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setURF] = useState("");
  const [userStoreFilter, setUSF] = useState("");
  const [togglingUser, setTogglingUser] = useState(null);
  const [togglingStore, setTogglingStore] = useState(null);

  const [storeSearch, setStoreSearch] = useState("");
  const [storeTypeFilter, setSTF] = useState("");

  const loadStores = () =>
    getStores({ all: true })
      .then((r) => setStores(r.data.data || []))
      .catch(() => {});

  const loadUsers = () => {
    setUL(true);
    fetchUsers()
      .then((r) => setUsers(r.data.data || []))
      .catch(() => {})
      .finally(() => setUL(false));
  };

  useEffect(() => {
    loadStores();
  }, []);
  useEffect(() => {
    if (tab === "all-users") loadUsers();
  }, [tab]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "role" ? { store_id: "" } : {}),
    }));
  };

  const filteredStores = stores.filter(
    (s) => s.store_type === ROLE_STORE_MAP[userForm.role] && s.is_active,
  );

  const handleUserSubmit = async () => {
    const { name, email, role, store_id, password, confirmPassword } = userForm;
    if (!name || !email || !role || !store_id || !password || !confirmPassword)
      return showToast("Please fill all required fields", "error");
    if (password !== confirmPassword)
      return showToast("Passwords do not match", "error");
    if (password.length < 6)
      return showToast("Password must be at least 6 characters", "error");

    setUserLoading(true);
    try {
      const res = await addUser({
        name,
        email,
        role,
        store_id,
        password,
        confirmPassword,
      });
      showToast(res.data.message || "User created successfully");
      setUserForm({
        name: "",
        email: "",
        role: "",
        store_id: "",
        password: "",
        confirmPassword: "",
      });
      loadUsers();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to create user", "error");
    } finally {
      setUserLoading(false);
    }
  };

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreForm((f) => ({ ...f, [name]: value }));
  };

  const handleStoreSubmit = async () => {
    if (!storeForm.store_code || !storeForm.store_name)
      return showToast("Store code and store name are required", "error");
    setStoreLoading(true);
    try {
      const res = await addStore({ ...storeForm, store_type: "SUB_STORE" });
      showToast(`Sub store "${res.data.data.store_name}" created successfully`);
      setStoreForm({ store_code: "", store_name: "", address: "", phone: "" });
      loadStores();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to create store", "error");
    } finally {
      setStoreLoading(false);
    }
  };

  const handleToggleUser = async (u) => {
    setTogglingUser(u.id);
    try {
      const res = await toggleUser(u.id);
      showToast(res.data.message);
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, is_active: !x.is_active } : x,
        ),
      );
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update user", "error");
    } finally {
      setTogglingUser(null);
    }
  };

  const handleToggleStore = async (s) => {
    setTogglingStore(s.store_id);
    try {
      const res = await toggleStore(s.store_id);
      showToast(res.data.message);
      setStores((prev) =>
        prev.map((x) =>
          x.store_id === s.store_id ? { ...x, is_active: !x.is_active } : x,
        ),
      );
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update store", "error");
    } finally {
      setTogglingStore(null);
    }
  };

  const displayedUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !userRoleFilter || u.role === userRoleFilter;
    const matchStore = !userStoreFilter || u.store_name === userStoreFilter;
    return matchSearch && matchRole && matchStore;
  });

  const displayedStores = stores.filter((s) => {
    const q = storeSearch.toLowerCase();
    const matchSearch =
      !q ||
      s.store_name.toLowerCase().includes(q) ||
      s.store_code.toLowerCase().includes(q);
    const matchType = !storeTypeFilter || s.store_type === storeTypeFilter;
    return matchSearch && matchType;
  });

  const uniqueStoreNames = [
    ...new Set(users.map((u) => u.store_name).filter(Boolean)),
  ].sort();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage users, stores and branches
        </p>
      </div>

      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center gap-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${tab === t.id ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── ADD USER ─────────────────────────────────────────── */}
      {tab === "user" && (
        <div className="max-w-xl">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Role *</label>
                <select
                  name="role"
                  value={userForm.role}
                  onChange={handleUserChange}
                  className={inputClass}
                >
                  <option value="">Select Role</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Store / Branch *</label>
                <select
                  name="store_id"
                  value={userForm.store_id}
                  onChange={handleUserChange}
                  disabled={!userForm.role}
                  className={
                    inputClass +
                    (!userForm.role ? " opacity-50 cursor-not-allowed" : "")
                  }
                >
                  <option value="">
                    {userForm.role ? "Select Store" : "Select role first"}
                  </option>
                  {filteredStores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  name="name"
                  value={userForm.name}
                  onChange={handleUserChange}
                  placeholder="e.g. Ahmed Khan"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleUserChange}
                  placeholder="e.g. ahmed@company.com"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={userForm.password}
                    onChange={handleUserChange}
                    placeholder="Min 6 characters"
                    className={inputClass + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-500 transition-colors"
                  >
                    {showPass ? <EyeOpen /> : <EyeClosed />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={userForm.confirmPassword}
                    onChange={handleUserChange}
                    placeholder="Repeat password"
                    className={inputClass + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-500 transition-colors"
                  >
                    {showConfirm ? <EyeOpen /> : <EyeClosed />}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleUserSubmit}
                disabled={userLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {userLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create User Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD SUB STORE ─────────────────────────────────────── */}
      {tab === "store" && (
        <div className="max-w-xl">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Store Code *</label>
                <input
                  name="store_code"
                  value={storeForm.store_code}
                  onChange={handleStoreChange}
                  placeholder="e.g. SUB-004"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Store Name *</label>
                <input
                  name="store_name"
                  value={storeForm.store_name}
                  onChange={handleStoreChange}
                  placeholder="e.g. Sub Store Delta"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                name="address"
                value={storeForm.address}
                onChange={handleStoreChange}
                placeholder="e.g. Block 5, Karachi"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                name="phone"
                value={storeForm.phone}
                onChange={handleStoreChange}
                placeholder="e.g. 021-1234567"
                className={inputClass}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-600 text-xs">
              This store will be created as a{" "}
              <span className="font-bold">SUB_STORE</span>. After creating it,
              go to <span className="font-bold">Add User</span> tab to assign
              staff.
            </div>
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleStoreSubmit}
                disabled={storeLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {storeLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create Sub Store"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ALL USERS ─────────────────────────────────────────── */}
      {tab === "all-users" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56"
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setURF(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select
              value={userStoreFilter}
              onChange={(e) => setUSF(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Stores</option>
              {uniqueStoreNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {(userSearch || userRoleFilter || userStoreFilter) && (
              <button
                onClick={() => {
                  setUserSearch("");
                  setURF("");
                  setUSF("");
                }}
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

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    "Name",
                    "Email",
                    "Role",
                    "Store",
                    "Status",
                    "Created",
                    "Action",
                  ].map((h) => (
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
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${!u.is_active ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3 text-gray-800 font-semibold">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 border border-gray-200 text-gray-600 text-xs font-mono px-2 py-0.5 rounded">
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {u.store_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold ${u.is_active ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleUser(u)}
                          disabled={togglingUser === u.id}
                          className={`text-xs font-semibold px-3 py-1 rounded border transition-colors disabled:opacity-40
                          ${
                            u.is_active
                              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {togglingUser === u.id
                            ? "..."
                            : u.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-gray-400 text-xs">
            {displayedUsers.length} user{displayedUsers.length !== 1 ? "s" : ""}{" "}
            shown
          </div>
        </div>
      )}

      {/* ── ALL STORES ────────────────────────────────────────── */}
      {tab === "all-stores" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56"
            />
            <select
              value={storeTypeFilter}
              onChange={(e) => setSTF(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="HEAD_OFFICE">Head Office</option>
              <option value="MAIN_STORE">Main Store</option>
              <option value="SUB_STORE">Sub Store</option>
            </select>
            {(storeSearch || storeTypeFilter) && (
              <button
                onClick={() => {
                  setStoreSearch("");
                  setSTF("");
                }}
                className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded"
              >
                Clear
              </button>
            )}
            <button
              onClick={loadStores}
              className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    "Store Code",
                    "Store Name",
                    "Type",
                    "Address",
                    "Phone",
                    "Status",
                    "Action",
                  ].map((h) => (
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
                {displayedStores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No stores found.
                    </td>
                  </tr>
                ) : (
                  displayedStores.map((s) => (
                    <tr
                      key={s.store_id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${!s.is_active ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-emerald-600 text-xs font-bold">
                          {s.store_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-semibold">
                        {s.store_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded border font-mono
                        ${
                          s.store_type === "HEAD_OFFICE"
                            ? "bg-purple-50 border-purple-200 text-purple-600"
                            : s.store_type === "MAIN_STORE"
                              ? "bg-blue-50 border-blue-200 text-blue-600"
                              : "bg-emerald-50 border-emerald-200 text-emerald-600"
                        }`}
                        >
                          {STORE_TYPE_LABELS[s.store_type] || s.store_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.address || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold ${s.is_active ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStore(s)}
                          disabled={togglingStore === s.store_id}
                          className={`text-xs font-semibold px-3 py-1 rounded border transition-colors disabled:opacity-40
                          ${
                            s.is_active
                              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {togglingStore === s.store_id
                            ? "..."
                            : s.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-gray-400 text-xs">
            {displayedStores.length} store
            {displayedStores.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
          ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-60 hover:opacity-100 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

