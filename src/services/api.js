import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5500/api",
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
export const approveRequest = (id, data) =>
  API.patch(`/requests/${id}/approve`, data);
export const rejectRequest = (id, data) =>
  API.patch(`/requests/${id}/reject`, data);
export const fulfillRequest = (id) => API.patch(`/requests/${id}/fulfill`, {});

export default API;
