export const ROLE_STORE_MAP = {
  "sub-store": "SUB_STORE",
  "sub-store-approver": "SUB_STORE",
  "main-store": "MAIN_STORE",
  "main-store-approver": "MAIN_STORE",
  headoffice: "HEAD_OFFICE",
}

export const ROLES = [
  { value: "sub-store", label: "Sub Store Staff" },
  { value: "sub-store-approver", label: "Sub Store Manager" },
  { value: "main-store", label: "Main Store Staff" },
  { value: "main-store-approver", label: "Main Store Manager" },
  { value: "headoffice", label: "Head Office" },
  { value: "admin", label: "Admin" },
]

export const ROLE_LABELS = {
  "sub-store": "Sub Store Staff",
  "sub-store-approver": "Sub Store Manager",
  "main-store": "Main Store Staff",
  "main-store-approver": "Main Store Manager",
  headoffice: "Head Office",
  admin: "Admin",
  "super admin": "Super Admin",
}

export const TABS = [
  { id: "user", label: "Add User" },
  { id: "store", label: "Add Sub Store" },
  { id: "all-users", label: "All Users" },
  { id: "all-stores", label: "All Stores" },
]

export const STORE_TYPE_LABELS = {
  MAIN_STORE: "Main Store",
  SUB_STORE: "Sub Store",
  HEAD_OFFICE: "Head Office",
}

export const inputClass =
  "w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400";

export const labelClass =
  "text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1";