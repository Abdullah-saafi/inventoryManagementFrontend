import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStores, getItems, getRequests, getLowStock } from "../services/api";
import {
  StatCard,
  Spinner,
  ErrorMsg,
  StatusBadge,
  StoreTypeBadge,
} from "../components/UI";

export default function Dashboard() {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getStores(), getItems(), getRequests(), getLowStock()])
      .then(([s, i, r, ls]) => {
        setStores(s.data.data);
        setItems(i.data.data);
        setRequests(r.data.data);
        setLowStock(ls.data.data);
      })
      .catch(() => setError("Assalammualaikum, This will be Dashboard page."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} />;

  const pending = requests.filter((r) => r.status === "PENDING").length;
  const approved = requests.filter((r) => r.status === "APPROVED").length;
  const fulfilled = requests.filter((r) => r.status === "FULFILLED").length;
  const rejected = requests.filter((r) => r.status === "REJECTED").length;

  const recentRequests = [...requests].slice(0, 6);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Inventory Management System Overview
        </p>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Stores" value={stores.length} color="violet" />
        <StatCard label="Total Items" value={items.length} color="emerald" />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          color="red"
          sub="Need reorder"
        />
        <StatCard label="Total Requests" value={requests.length} color="blue" />
      </div>

      {/* Stats Row 2 — Request statuses */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Pending"
          value={pending}
          color="amber"
          sub="Awaiting approval"
        />
        <StatCard
          label="Approved"
          value={approved}
          color="emerald"
          sub="Ready to fulfill"
        />
        <StatCard
          label="Fulfilled"
          value={fulfilled}
          color="blue"
          sub="Completed"
        />
        <StatCard
          label="Rejected"
          value={rejected}
          color="red"
          sub="Declined"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Requests */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">Recent Requests</h2>
            <Link
              to="/requests"
              className="text-emerald-400 text-xs hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentRequests.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">
                No requests yet
              </p>
            )}
            {recentRequests.map((r) => (
              <div
                key={r.request_id}
                className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2.5"
              >
                <div>
                  <span className="text-white text-sm font-mono font-semibold">
                    {r.request_no}
                  </span>
                  <span className="text-slate-500 text-xs ml-2">
                    {r.from_store_name} → {r.to_store_name}
                  </span>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Stores Summary */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">Stores</h2>
            <Link
              to="/stores"
              className="text-emerald-400 text-xs hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {stores.map((s) => (
              <div
                key={s.store_id}
                className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2.5"
              >
                <div>
                  <div className="text-white text-sm font-semibold">
                    {s.store_name}
                  </div>
                  <div className="text-slate-500 text-xs font-mono">
                    {s.store_code}
                  </div>
                </div>
                <StoreTypeBadge type={s.store_type} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-red-400 font-bold text-sm">
              Low Stock Alert ({lowStock.length} items)
            </h2>
            <Link to="/items" className="text-red-400 text-xs hover:underline">
              View items
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStock.slice(0, 6).map((i) => (
              <div
                key={i.item_id}
                className="bg-slate-800 rounded-lg px-3 py-2"
              >
                <div className="text-white text-sm font-semibold">
                  {i.item_name}
                </div>
                <div className="text-slate-400 text-xs">
                  {i.store_name} ·{" "}
                  <span className="text-red-400 font-mono">
                    {i.item_quantity}
                  </span>{" "}
                  / {i.min_quantity} {i.item_uom}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
