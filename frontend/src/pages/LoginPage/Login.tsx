import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../lib/auth.api";
import { useAuth } from "../../auth/authContext";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const canSubmit = useMemo(() => {
    return (
      form.username.trim().length >= 3 &&
      form.password.length >= 1 &&
      !loading
    );
  }, [form.username, form.password, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const data = await login({
        username: form.username.trim(),
        password: form.password,
      });

      // ✅ Store token + user in AuthContext (sessionStorage handled inside context)
      setAuth({
        token: data.token,
        user: data.user,
      });

      const role = data.user.role_name;

      // ✅ Role-based redirect
     if (role === "AOCC_CONTROLLER") {
  navigate("/aocc", { replace: true });

} else if (role === "APRON_CONTROLLER") {
  navigate("/apron", { replace: true });

} else if (role === "ATC_CONTROLLER") {
  navigate("/atc", { replace: true });

} else if (role === "AIRLINE") {
  navigate("/airline", { replace: true });

} else {
  navigate("/login", { replace: true });
}
    } catch (error: any) {
      setErr(error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-blue-600 shadow-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg">AAI</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Airport Bay Allocation System
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-blue-100 bg-white shadow-xl">
          <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                value={form.username}
                onChange={(e) =>
                  setForm((s) => ({ ...s, username: e.target.value }))
                }
                autoComplete="username"
                placeholder="Enter username"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, password: e.target.value }))
                  }
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-12 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {/* Signup link */}
            <div className="pt-2 text-center text-sm text-slate-600">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-blue-700 hover:underline"
              >
                Create account
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Airport Authority of India
        </div>
      </div>
    </div>
  );
}