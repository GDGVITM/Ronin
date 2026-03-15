import { http } from "./http";
import type { AuthUser } from "../types";

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  college: string;
}) {
  const { data } = await http.post("/auth/register", payload);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await http.post<{ token: string; user: AuthUser }>("/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await http.get<AuthUser>("/auth/me");
  return data;
}
