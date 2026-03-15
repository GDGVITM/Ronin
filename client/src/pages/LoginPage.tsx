import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { connectSocket } from "../socket/client";
import { useAuthStore } from "../store/auth.store";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await login({ email, password });
      setSession(data.token, data.user);
      connectSocket(data.token);
      navigate(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Login failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <form className="w-full space-y-4 rounded bg-ghost-panel p-6 text-white" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-semibold text-ghost-gold">Login</h2>
        <input className="w-full rounded bg-black/40 p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded bg-black/40 p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p className="text-sm text-ghost-red">{error}</p> : null}
        <button className="w-full rounded bg-ghost-gold px-4 py-2 font-semibold text-black" type="submit">
          Enter The Grid
        </button>
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-ghost-gold hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}
