import { useEffect, useState } from "react";
import { getUsers, userStatus } from "../services/api";
import useErrorHandler from "../components/useErrorHandler";
import { useAuth } from "../context/authContext";
import BlockedUI from "../components/BlockedUI";
import { useNavigate } from "react-router-dom";

const AllStaffs = () => {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        search: "",
        role: "",
        active: "",
        page: 1
    });
    const [loading, setLoading] = useState(false);
    const handleError = useErrorHandler();
    
    const navigate = useNavigate()
    const { auth } = useAuth()

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getUsers(filters);
            setUsers([...response.data]);
        } catch (error) {
            handleError(error, "Error in all staffs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
    };

    const handleAction = async (id, currentStatus) => {
        try {
            setLoading(true)
            const toggledStatus = !currentStatus
            const response = await userStatus({ id, status: toggledStatus })
            console.log("status",response.status);
            if (response.status === 200) {
                console.log("hellooo s");
                
                await fetchUsers()
            }
        } catch (error) {
            handleError(error, "Error in handle user status")
        } finally {
            setLoading(false)
        }
    }

    if (auth.isBlocked) {
        return <BlockedUI message={auth.message} />
    }

    return (
        <div className="bg-slate-900 min-h-screen p-6 rounded-xl">
            {/* HEADER SECTION */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight">
                        All Users
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Manage internal user accounts and store assignments
                    </p>
                </div>
            </div>

            {/* FILTERS SECTION */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <input
                    type="text"
                    name="search"
                    placeholder="Search name or email..."
                    onChange={handleChange}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 min-w-[250px] placeholder:text-slate-500"
                />

                <select
                    name="role"
                    onChange={handleChange}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                    <option value="">All Roles</option>
                    <option value="sub-store">Sub Store Staff</option>
                    <option value="sub-store-approver">Sub Store Manager</option>
                    <option value="main-store">Main Store</option>
                    <option value="main-store-approver">Main Store Manager</option>
                    <option value="headoffice">Head Officer</option>
                </select>

                <select
                    name="active"
                    onChange={handleChange}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            {/* TABLE SECTION */}
            <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-800 border-b border-slate-700">
                            {[
                                "Staff Member",
                                "Role",
                                "Assigned Store",
                                "Created Date",
                                "Status",
                                "Action",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12">
                                    <div className="inline-block w-6 h-6 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-500">
                                    No staff members found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="px-4 py-4">
                                        <div className="text-slate-200 font-bold">{u.name}</div>
                                        <div className="text-slate-500 text-xs">{u.email}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-slate-400 capitalize">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-300 italic">
                                        {u.store_name || "—"}
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 text-xs">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${u.is_active
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                : "bg-red-500/10 border-red-500/20 text-red-400"
                                            }`}>
                                            {u.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border cursor-pointer ${u.is_active
                                                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/30"
                                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                                }`}
                                            onClick={() => handleAction(u.id, u.is_active)}
                                        >
                                            {u.is_active ? "Deactivate" : "Activate"}
                                        </button>
                                        <button onClick={() => navigate(`/edit-user/${u.id}`)}>Edit</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION SECTION */}
            <div className="flex items-center justify-between mt-6">
                <div className="text-slate-500 text-xs font-medium">
                    Page <span className="text-white">{filters.page}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={filters.page === 1 || loading}
                        onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                        className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 bg-slate-800 rounded px-3 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        disabled={loading || users.length < 10}
                        onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                        className="text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded px-4 py-1.5 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AllStaffs;