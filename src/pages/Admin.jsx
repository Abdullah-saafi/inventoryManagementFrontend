import { useState } from "react";
import AddStore from "./AddStore";
import StoreList from "./StoreList";
import AddUser from "./AddUser"; 
import ListUser from "./ListUser";

const TABS = [
  { id: "add-user", label: "Create User" },
  { id: "add-store", label: "New Store" },
  { id: "list-users", label: "All Users" },
  { id: "list-stores", label: "All Stores" },
];

export default function Admin() {
  const [tab, setTab] = useState("list-users");

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Admin Control</h1>
        <p className="text-gray-500 text-sm font-medium">System management & access control</p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex gap-2 mb-10 bg-gray-100 p-1.5 rounded-xl w-fit border border-gray-200 shadow-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all
              ${tab === t.id ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* CONTENT AREA */}
      <div className="mt-4">
        {tab === "list-users" && <ListUser />}
        {tab === "add-user" && <AddUser />}
        {tab === "list-stores" && <StoreList />}
        {tab === "add-store" && <AddStore />}
      </div>
    </div>
  );
}