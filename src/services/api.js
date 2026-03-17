import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
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
