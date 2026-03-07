import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "../context/authContext.jsx"
import { login } from "../services/api.js"

const Login = () => {
    const navigate = useNavigate()

    const { auth, setAuth } = useAuth()

    const [form, setForm] = useState({ email: "", password: "" })
    const [message, setMessage] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

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

                if (data.role === "sub-store") {
                    navigate("/substore-staff")
                } else if(data.role === "sub-store-approver") {
                    navigate("/substore-manager")
                } else if(data.role === "main-store"){
                    navigate("/mainstore")
                } else if(data.role === "headoffice"){
                    navigate("/headoffice")
                } else{
                    navigate("/substore-staff")
                }

            }

        } catch (err) {
            console.log("Full error object:", err);
            
            if (err.response && err.response.data) {
                setMessage(err.response.data.message); 
            } else {
                setMessage("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    return (
        <>
            <div className="bg-red-600"></div>
            <div id="container">
                <h1>Login</h1>
                {message && <p className="error-message">{message}</p>}
        {auth.message && <p className="error-message">{auth.message}</p>}
                <form className="login-form" onSubmit={handleSubmit}>

                    <div className={message === "Invalid username or password" ? "incorrect" : message === "Email is required" ? "incorrect" : ""}>
                        <label htmlFor="email"><svg xmlnsx="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280 320-200v-80L480-520 160-720v80l320 200Z" /></svg></label>
                        <input className="login-form-input" type="text" name='email' id='email' placeholder='Enter Email' value={form.email} onChange={handleChange} onFocus={() => setMessage(null)} />
                    </div>

                    <div className={`password-group ${message === "Invalid username or password" ? "incorrect" : message === "Password is required" ? "incorrect" : ""}`}>
                        <label htmlFor="password"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm296.5-223.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z" /></svg></label>
                        <div className="input-wrapper">
                            <input className="login-form-input" type={showPassword ? "text" : "password"} name='password' id='password' placeholder='Enter Password' value={form.password} onChange={handleChange} />
                            <span className="toggle-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M607.5-372.5Q660-425 660-500t-52.5-127.5Q555-680 480-680t-127.5 52.5Q300-575 300-500t52.5 127.5Q405-320 480-320t127.5-52.5Zm-204-51Q372-455 372-500t31.5-76.5Q435-608 480-608t76.5 31.5Q588-545 588-500t-31.5 76.5Q525-392 480-392t-76.5-31.5ZM214-281.5Q94-363 40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200q-146 0-266-81.5ZM480-500Zm207.5 160.5Q782-399 832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280q113 0 207.5-59.5Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" /></svg>}</span>
                        </div>
                    </div>

                    <button className="submit-btn" disabled={loading}> {loading ? <span className="spinner"></span> : "Login"} </button>
                </form>
            </div>
        </>
    )
}

export default Login