import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5500/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Stores ──────────────────────────────────────────────────
export const getStores = (params) => API.get("/stores", { params });
export const getStoreById = (id) => API.get(`/stores/${id}`);
export const createStore = (data) => API.post("/stores", data);

// ── Items ────────────────────────────────────────────────────
export const getItems = (params) => API.get("/items", { params });
export const getItemById = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post("/items", data);
export const updateItem = (id, data) => API.patch(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);

// ── Requests ─────────────────────────────────────────────────
export const getRequests = (params) => API.get("/requests", { params });
export const getRequestById = (id) => API.get(`/requests/${id}`);
export const getItemSummary = (params) =>
  API.get("/requests/item-summary", { params });
export const createRequest = (data) => API.post("/requests", data);

// These three endpoints work for BOTH flows (SUB_TO_MAIN and MAIN_TO_HO)
//
// SUB_TO_MAIN:
//   approveRequest  → called by sub-store-approver  (Sub Store Manager)
//   rejectRequest   → called by sub-store-approver
//   fulfillRequest  → called by main-store staff
//
// MAIN_TO_HO:
//   approveRequest  → called by main-store-approver (Main Store Manager)
//   rejectRequest   → called by main-store-approver
//   fulfillRequest  → called by headoffice staff

export const approveRequest = (id, data) =>
  API.patch(`/requests/${id}/approve`, data);
export const rejectRequest = (id, data) =>
  API.patch(`/requests/${id}/reject`, data);
export const fulfillRequest = (id) => API.patch(`/requests/${id}/fulfill`, {});

// ── Users ────────────────────────────────────────────────────
export const login = (credentials) => API.post("/users/login", credentials);
export const refreshToken = () => API.post("/users/refresh");
export const logout = () => API.post("/users/logout");

export default API;
