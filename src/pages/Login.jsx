import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/authContext.jsx";
import { login } from "../services/api.js";

const Login = () => {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) return setMessage("Email is required");
    if (!form.password) return setMessage("Password is required");

    try {
      setLoading(true);
      const response = await login(form);
      const data = response.data;
      if (data) {
        setMessage(data.message);
        setAuth({
          accessToken: data.accessToken,
          username: data.username,
          role: data.role,
          storeName: data.storeName,
          store_id: data.storeId,
        });

        const routes = {
          "sub-store": "/substore-staff",
          "sub-store-approver": "/substore-manager",
          "main-store": "/mainstore",
          "main-store-approver": "/mainstore-approver",
          headoffice: "/headoffice",
          admin: "/admin",
          "super admin": "/substore-staff",
        };
        navigate(routes[data.role] || "/unauthorized");
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputWrapperClass = (fieldError) => `
        flex items-center w-full rounded-lg overflow-hidden border-2 transition-all duration-200
        ${
          fieldError
            ? "border-red-500 bg-red-50"
            : "border-gray-300 bg-white focus-within:border-emerald-500"
        }
    `;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-start font-sans">
      <div
        id="container"
        className="w-full max-w-[500px] h-screen bg-white p-8 flex flex-col justify-center items-center shadow-2xl border-r border-gray-200"
      >
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2">
          Login
        </h1>

        <p className="text-gray-500 mb-8 text-sm">
          Welcome back! Please enter your details.
        </p>

        {(message || auth.message) && (
          <div className="w-full p-3 mb-4 rounded bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
            {message || auth.message}
          </div>
        )}

        <form
          className="w-full max-w-[350px] space-y-4"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div
            className={inputWrapperClass(
              message?.includes("Email") ||
                message === "Invalid username or password",
            )}
          >
            <label className="p-3 bg-gray-100 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="currentColor"
              >
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280 320-200v-80L480-520 160-720v80l320 200Z" />
              </svg>
            </label>

            <input
              className="bg-transparent border-none w-full p-3 text-gray-800 outline-none text-sm placeholder:text-gray-400"
              type="text"
              name="email"
              placeholder="Enter Email"
              value={form.email}
              onChange={handleChange}
              onFocus={() => setMessage(null)}
            />
          </div>

          {/* Password */}
          <div
            className={inputWrapperClass(
              message?.includes("Password") ||
                message === "Invalid username or password",
            )}
          >
            <label className="p-3 bg-gray-100 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="currentColor"
              >
                <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm296.5-223.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z" />
              </svg>
            </label>

            <div className="flex-grow flex items-center pr-2">
              <input
                className="bg-transparent border-none w-full p-3 text-gray-800 outline-none text-sm placeholder:text-gray-400"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter Password"
                value={form.password}
                onChange={handleChange}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-emerald-500 transition-colors focus:outline-none p-2"
              >
                👁
              </button>
            </div>
          </div>

          <button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-emerald-900/10"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex flex-grow h-screen bg-gray-50 items-center justify-center relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -top-20 -right-20"></div>
        <div className="absolute w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] bottom-0 left-0"></div>

        <div className="text-center z-10">
          <h2 className="text-gray-900 text-2xl font-light tracking-widest uppercase">
            Inventory Management System
          </h2>
          <p className="text-gray-500 mt-2">Precision. Efficiency. Control.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
