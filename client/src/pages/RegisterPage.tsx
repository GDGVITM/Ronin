import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await register({ name, college, email, password });
      setMessage("Registration submitted! An admin will approve your account. You can then log in.");
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Registration failed"
      );
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <form className="w-full space-y-4 rounded bg-ghost-panel p-6 text-white" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-semibold text-ghost-gold">Register</h2>
        <input className="w-full rounded bg-black/40 p-2" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full rounded bg-black/40 p-2" placeholder="College" value={college} onChange={(e) => setCollege(e.target.value)} required />
        <input className="w-full rounded bg-black/40 p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded bg-black/40 p-2" placeholder="Password (min 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {message ? <p className="text-sm text-ghost-green">{message}</p> : null}
        {error ? <p className="text-sm text-ghost-red">{error}</p> : null}
        <button className="w-full rounded bg-ghost-gold px-4 py-2 font-semibold text-black" type="submit">
          Submit
        </button>
        <p className="text-center text-sm text-gray-400">
          Already registered?{" "}
          <Link to="/login" className="text-ghost-gold hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
