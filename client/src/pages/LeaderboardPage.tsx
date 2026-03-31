import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import type { LeaderboardEntry } from "../types";

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await http.get<LeaderboardEntry[]>(
        "/round/leaderboard/global",
      );
      setLeaderboard(data);
    } catch {
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div
      className="contest-bg min-h-screen relative"
      style={{ color: "#1A1A1A" }}
    >
      <div
        className="absolute inset-0 contest-grid-overlay pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="creepy-fog absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      <header className="relative z-20 w-full px-4 pt-4 pb-2 md:px-8">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 landing-navbar px-5 py-3">
          <h1 className="font-['Cinzel',serif] text-lg font-bold tracking-wide text-[#8B0000]">
            Global Leaderboard
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void loadLeaderboard();
              }}
              className="rounded border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.06)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#8B0000] transition hover:bg-[rgba(139,0,0,0.11)]"
            >
              Refresh
            </button>
            <Link
              to="/"
              className="contest-btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-8 md:px-8">
        <section
          className="rounded-[24px] p-4 md:p-6"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,252,243,0.96) 0%, rgba(248,238,215,0.92) 100%)",
            border: "1px solid rgba(201,163,78,0.25)",
            boxShadow: "0 8px 28px rgba(26,26,26,0.08)",
          }}
        >
          {loading ? (
            <p className="py-8 text-center text-sm text-[rgba(26,26,26,0.65)]">
              Loading leaderboard...
            </p>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#8B0000]">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="py-8 text-center text-sm text-[rgba(26,26,26,0.65)]">
              No participants yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="text-left text-[rgba(26,26,26,0.65)]">
                    <th className="pb-3">Rank</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">College</th>
                    <th className="pb-3">Bits</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className="border-t border-[rgba(201,163,78,0.20)] bg-[rgba(223,211,194,0.72)]"
                    >
                      <td
                        className={`py-2.5 font-bold ${i === 0 ? "text-ghost-gold" : "text-[rgba(26,26,26,0.56)]"}`}
                      >
                        #{i + 1}
                      </td>
                      <td className="py-2.5 font-medium">{entry.name}</td>
                      <td className="py-2.5 text-[rgba(26,26,26,0.65)]">
                        {entry.college}
                      </td>
                      <td className="py-2.5 font-mono text-ghost-gold">
                        {entry.bits}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            entry.eliminated
                              ? "bg-ghost-red/20 text-ghost-red"
                              : "bg-ghost-green/20 text-ghost-green"
                          }`}
                        >
                          {entry.eliminated ? "Eliminated" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
