import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center p-6 text-center text-white">
      <h1 className="text-4xl font-bold text-ghost-gold">The Way Of Ghost</h1>
      <p className="mt-4 text-gray-300">
        Real-time DSA rivalry platform for coding duels, quiz battles, and auction finale.
      </p>
      <div className="mt-8 flex gap-4">
        <Link className="rounded bg-ghost-gold px-4 py-2 font-semibold text-black" to="/login">
          Login
        </Link>
        <Link className="rounded border border-ghost-gold px-4 py-2 text-ghost-gold" to="/register">
          Register
        </Link>
      </div>
    </div>
  );
}
