import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "aba_auth";

// fallback mapping (only used if backend doesn’t send role_name)
const ROLE_BY_ID = {
  3: "AOCC_CONTROLLER",
  4: "APRON_CONTROLLER",
  1: "ATC_CONTROLLER",
  6: "AIRLINE",
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setToken(parsed?.token || null);
      setUser(parsed?.user || null);
    } catch {}
  }, []);

  useEffect(() => {
    if (!token) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  }, [token, user]);

  const roleName = useMemo(() => {
    return user?.role_name || ROLE_BY_ID[user?.role_id] || "UNKNOWN";
  }, [user]);

  const value = useMemo(
    () => ({
      token,
      user,
      roleName,
      isAuthed: Boolean(token),
      setAuth: ({ token, user }) => {
        setToken(token);
        setUser(user);
      },
      logout: () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem(STORAGE_KEY);
      },
    }),
    [token, user, roleName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
