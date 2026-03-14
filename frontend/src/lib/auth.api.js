// src/lib/auth.api.js
import { api } from "./api";

export function login(payload) {
  return api("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function signup(payload) {
  return api("/api/auth/signup", {
    method: "POST",
    body: payload,
  });
}
