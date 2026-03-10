import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5500/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Stores ──────────────────────────────────────────────
export const getStores = () => API.get("/stores");
export const getStoreById = (id) => API.get(`/stores/${id}`);
export const createStore = (data) => API.post("/stores", data);
export const updateStore = (id, data) => API.put(`/stores/${id}`, data);
export const getStoreInventory = (id) => API.get(`/stores/${id}/inventory`);

// ── Items ────────────────────────────────────────────────
export const getItems = (params) => API.get("/items", { params });
export const getItemById = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post("/items", data);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);
export const getLowStock = (params) => API.get("/items/low-stock", { params });

// ── Requests ─────────────────────────────────────────────
export const getRequests = (params) => API.get("/requests", { params });
export const getRequestById = (id) => API.get(`/requests/${id}`);
export const createRequest = (data) => API.post("/requests", data);

// Sub Store Manager (1st level): PENDING → APPROVED
export const approveRequest = (id, data) =>
  API.patch(`/requests/${id}/approve`, data);

// Sub Store Manager (1st level): PENDING → REJECTED
export const rejectRequest = (id, data) =>
  API.patch(`/requests/${id}/reject`, data);

// Main Store Manager (2nd level / final): APPROVED → MANAGER_APPROVED
export const managerApproveRequest = (id, data) =>
  API.patch(`/requests/${id}/manager-approve`, data);

// Main Store Manager (2nd level): APPROVED → REJECTED
export const managerRejectRequest = (id, data) =>
  API.patch(`/requests/${id}/manager-reject`, data);

// Main Store Staff: MANAGER_APPROVED → FULFILLED
export const fulfillRequest = (id) => API.patch(`/requests/${id}/fulfill`, {});

// Main Store Manager: HO_PENDING → HO_APPROVED
export const hoApproveRequest = (id, data) =>
  API.patch(`/requests/${id}/ho-approve`, data);

// Main Store Manager: HO_PENDING → REJECTED
export const hoRejectRequest = (id, data) =>
  API.patch(`/requests/${id}/ho-reject`, data);

// Head Office: HO_APPROVED → HO_FULFILLED
export const hoFulfillRequest = (id) =>
  API.patch(`/requests/${id}/ho-fulfill`, {});

// ── Users ────────────────────────────────────────────────
export const login = (credentials) => API.post("/users/login", credentials);
export const refreshToken = () => API.post("/users/refresh");
export const logout = () => API.post("/users/logout");

export default API;
