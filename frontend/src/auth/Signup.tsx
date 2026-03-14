import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../lib/auth.api";

export default function Signup() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    role_id: "",
    airline_code: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    const okBase =
      form.full_name.trim().length >= 2 &&
      form.username.trim().length >= 3 &&
      form.password.length >= 8 &&
      String(form.role_id).trim().length > 0;
    return okBase && !loading;
  }, [form, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await signup({
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        password: form.password,
        role_id: Number(form.role_id),
        airline_code: form.airline_code?.trim() || null,
      });

      nav("/login", { replace: true });
    } catch (e) {
      setErr(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
          <p className="mt-1 text-slate-600">
            Use your official credentials. Airline users must provide airline code.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. Santh Kumar"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. aocc_admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="Min 8 characters"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Role ID</label>
              <input
                value={form.role_id}
                onChange={(e) => setForm((s) => ({ ...s, role_id: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
                placeholder="e.g. 1"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Ask admin for Role ID.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Airline Code (if AIRLINE)
              </label>
              <input
                value={form.airline_code}
                onChange={(e) => setForm((s) => ({ ...s, airline_code: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
                placeholder="e.g. IX"
              />
            </div>
          </div>

          {err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <div className="pt-2 text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-slate-900 hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
