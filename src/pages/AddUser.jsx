import { useEffect, useState } from "react";
import { addUser, getStores } from "../services/api";
import useErrorHandler from "../components/useErrorHandler";

const AddUser = () => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        role: "",
        store_id: "",
        password: "",
        confirmPassword: "",
    });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const handleError = useErrorHandler()

    useEffect(() => {
        async function fetchStores() {
            try {
                const response = await getStores();
                setStores(response.data.data || []);
            } catch (error) {
                console.log("Failed to fetch stores", error);
            }
        }
        fetchStores();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        if (form.password !== form.confirmPassword) {
            setLoading(false);
            return setMessage("Passwords do not match");
        }

        try {
            const response = await addUser(form);
            setMessage(response.data.message);
        } catch (error) {
            const msg = handleError(error, "Error in add user")
            setMessage(msg)
            // console.log("SOMETHING WRONG IN ADD USER",error);
            
        } finally {
            setLoading(false);
        }
    };

    const roleStoreMapping = {
        "sub-store-approver": "SUB_STORE",
        "sub-store": "SUB_STORE",
        "headoffice": "HEAD_OFFICE",
        "main-store": "MAIN_STORE",
    };

    const inputClass = "w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 pr-10";
    const labelClass = "text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1";

    const EyeIcon = ({ visible }) => (
        visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
            </svg>
        )
    );

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-white">Add New User</h1>
                <p className="text-slate-400 text-sm mt-1">Create internal staff accounts and assign store branches</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Role *</label>
                        <select name="role" onChange={handleChange} className={inputClass} required>
                            <option value="">Select Role</option>
                            <option value="sub-store-approver">Sub Store Manager</option>
                            <option value="sub-store">Sub Store Staff</option>
                            <option value="headoffice">Head Officer</option>
                            <option value="main-store">Main Store Manager</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Branch / Store *</label>
                        <select name="store_id" onChange={handleChange} required className={inputClass}>
                            <option value="">Select Store</option>
                            {stores
                                .filter((s) => s.store_type === roleStoreMapping[form.role])
                                .map((s) => (
                                    <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Username</label>
                        <input name="username" autoComplete="off" onChange={handleChange} className={inputClass} required />
                    </div>

                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input type="email" name="email" autoComplete="off" onChange={handleChange} className={inputClass} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Password Field */}
                    <div className="relative">
                        <label className={labelClass}>Password</label>
                        <div className="relative">
                            <input 
                                type={showPass ? "text" : "password"} 
                                name="password"
                                autoComplete="new-password"
                                onChange={handleChange} 
                                className={inputClass} 
                                required 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-emerald-400 transition-colors"
                            >
                                <EyeIcon visible={showPass} />
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="relative">
                        <label className={labelClass}>Confirm Password</label>
                        <div className="relative">
                            <input 
                                type={showConfirmPass ? "text" : "password"} 
                                name="confirmPassword"
                                autoComplete="new-password"
                                onChange={handleChange} 
                                className={inputClass} 
                                required 
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-emerald-400 transition-colors"
                            >
                                <EyeIcon visible={showConfirmPass} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : "Create User Account"}
                    </button>
                </div>

                {message && (
                    <div className={`mt-4 p-3 rounded text-center text-sm font-medium border ${message.includes("Success") || message.includes("registered")
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                            : "bg-red-500/10 border-red-500/40 text-red-400"
                        }`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddUser;