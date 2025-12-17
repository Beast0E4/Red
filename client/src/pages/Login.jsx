import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/auth.slice";
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate ();
  const { loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const res = await dispatch(loginUser(form));
        if (res.payload) {
            navigate('/', { replace: true });
        }
    } catch (error) {
        // dispatch (showToast ({ message: error.message, type: 'error' }));
    }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome back 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Log in to continue chatting
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Email address
          </label>
          <input
            name="email"
            type="email"
            placeholder="john@example.com"
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-transparent transition"
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Password
          </label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-transparent transition"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Button */}
        <button
          disabled={loading}
          className={`w-full py-2.5 rounded-lg font-medium text-white transition
            ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="hover:underline cursor-pointer text-blue-600">
            Forgot password?
          </span>
          <span>
            New here?{" "}
            <Link className="text-blue-600 hover:underline cursor-pointer">
              Sign up
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
}
