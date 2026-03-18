import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { useAuth } from "../context/authContext.jsx"
import { login } from "../services/api.js"

const Login = () => {
    const navigate = useNavigate()
    const { auth, setAuth } = useAuth()
    const location = useLocation()

    const [form, setForm] = useState({ email: "", password: "" })
    const [message, setMessage] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if(location.state?.message){
            setMessage(location.state.message)
            window.history.replaceState({}, document.title)
        }
    },[location])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.email) return setMessage("Email is required")
        if (!form.password) return setMessage("Password is required")
        try {
            setLoading(true)
            const response = await login(form)
            const data = response.data
            if (data) {
                setMessage(data.message)
                setAuth({
                    accessToken: data.accessToken,
                    username: data.username,
                    role: data.role,
                    storeName: data.store_name,
                    store_id: data.storeId
                })
                const routes = {
                    "sub-store": "/substore-staff",
                    "sub-store-approver": "/substore-manager",
                    "main-store": "/mainstore",
                    "headoffice": "/headoffice"
                }
                navigate(routes[data.role] || "/substore-staff")
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        if(message) setMessage(null)
        if(auth.message) setAuth({message: null})
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const inputWrapperClass = (fieldError) => `
    flex items-center w-full rounded-lg overflow-hidden border-2 transition-all duration-200
    bg-slate-800 
    ${fieldError ? 'border-red-500' : 'border-slate-700 focus-within:border-emerald-500'}
`
    const autofillFix = "autofill:shadow-[inset_0_0_0px_1000px_#1e293b] [-webkit-text-fill-color:white]";

    const hasError = !!(message || auth.message);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-start font-sans">
            <div id="container" className="w-full max-w-[500px] h-screen bg-slate-900 p-8 flex flex-col justify-center items-center shadow-2xl border-r border-slate-800">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Login</h1>
                <p className="text-slate-400 mb-8 text-sm">Welcome back! Please enter your details.</p>

                {(message || auth.message) && (
                    <div className="w-full p-3 mb-4 rounded bg-red-500/10 border border-red-500/50 text-red-500 text-sm text-center font-medium">
                        {message || auth.message}
                    </div>
                )}

                <form className="w-full max-w-[350px] space-y-4" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className={inputWrapperClass(message || auth.message)}>
                        <label htmlFor="email" className={`p-3 text-slate-400 ${hasError ? 'bg-red-500/50 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280 320-200v-80L480-520 160-720v80l320 200Z" /></svg>
                        </label>
                        <input
                            className={`bg-transparent border-none w-full p-3 text-white outline-none text-sm placeholder:text-slate-500 ${autofillFix}`}
                            type="email"
                            id="email"
                            name='email'
                            placeholder='Enter Email'
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password Field */}
                    <div className={inputWrapperClass(message || auth.message)}>
                        <label htmlFor="password" className={`p-3 text-slate-400 ${hasError ? 'bg-red-500/50 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm296.5-223.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z" /></svg>
                        </label>
                        <div className="flex-grow flex items-center pr-2">
                            <input
                                className={`bg-transparent border-none w-full p-3 text-white outline-none text-sm placeholder:text-slate-500 ${autofillFix}`}
                                type={showPassword ? "text" : "password"}
                                name='password'
                                id="password"
                                placeholder='Enter Password'
                                autoComplete="current-password"
                                value={form.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none p-2"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                        <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                        <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-emerald-900/20" disabled={loading}>
                        {loading ? "Processing..." : "Login"}
                    </button>
                </form>
            </div>
            <div className="hidden lg:flex flex-grow h-screen bg-slate-950 items-center justify-center relative overflow-hidden">
                <div className="text-center z-10">
                    <h2 className="text-slate-200 text-2xl font-light tracking-widest uppercase">Inventory Management System</h2>
                    <p className="text-slate-500 mt-2">Precision. Efficiency. Control.</p>
                </div>
            </div>
        </div>
    )
}

export default Login