import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { useAuthStore } from "../store/auth.store";
import { getSocket } from "../socket/client";
import type { EventState, LeaderboardEntry } from "../types";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    http.get<EventState>("/round/event-state").then(({ data }) => setEventState(data)).catch(() => null);
    http.get<LeaderboardEntry[]>("/round/leaderboard/global").then(({ data }) => setLeaderboard(data)).catch(() => null);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data: { roundNumber: number; eventState: EventState }) => {
      setEventState(data.eventState);
    };
    socket.on("round:started", handler);
    return () => { socket.off("round:started", handler); };
  }, []);

  const roundNames = ["", "Shadow Tactics", "Shrine Of Wisdom", "Khan's Ultimatum"];
  const roundDescs = [
    "",
    "1v1 Coding Duel — Solve algorithmic problems head-to-head",
    "1v1 Debugging MCQ — Find bugs in Java code faster than your opponent",
    "MVP Building — Build a working prototype from a problem statement",
  ];

  const myEntry = leaderboard.find((e) => e.id === user?.id);

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-6 text-white">
      <h1 className="text-3xl font-bold text-ghost-gold">Dashboard</h1>
      <p className="mt-1 text-gray-300">Welcome, {user?.name ?? "participant"}</p>

      {/* User stats */}
      {myEntry && (
        <div className="mt-4 flex gap-4">
          <div className="rounded bg-ghost-panel px-4 py-3">
            <p className="text-xs text-gray-400">Your Bits</p>
            <p className="text-2xl font-bold text-ghost-gold">{myEntry.bits}</p>
          </div>
          <div className="rounded bg-ghost-panel px-4 py-3">
            <p className="text-xs text-gray-400">Rank</p>
            <p className="text-2xl font-bold text-ghost-gold">
              #{leaderboard.findIndex((e) => e.id === user?.id) + 1}
            </p>
          </div>
          <div className="rounded bg-ghost-panel px-4 py-3">
            <p className="text-xs text-gray-400">Status</p>
            <p className={`text-2xl font-bold ${myEntry.eliminated ? "text-ghost-red" : "text-ghost-green"}`}>
              {myEntry.eliminated ? "Eliminated" : "Active"}
            </p>
          </div>
        </div>
      )}

      {/* Active round banner */}
      {eventState && eventState.roundStatus === "LIVE" && eventState.currentRound > 0 && (
        <div className="mt-6 rounded-lg border border-ghost-gold/30 bg-ghost-gold/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ghost-gold">ROUND {eventState.currentRound} IS LIVE</p>
              <p className="text-xl font-bold">{roundNames[eventState.currentRound]}</p>
              <p className="mt-1 text-sm text-gray-300">{roundDescs[eventState.currentRound]}</p>
            </div>
            <Link
              to={`/round/${eventState.currentRound}`}
              className="rounded bg-ghost-gold px-6 py-3 text-lg font-bold text-black hover:bg-yellow-400"
            >
              Enter Round
            </Link>
          </div>
        </div>
      )}

      {(!eventState || eventState.roundStatus !== "LIVE") && (
        <div className="mt-6 rounded bg-ghost-panel p-6 text-center">
          <p className="text-lg text-gray-400">No round is currently active.</p>
          <p className="mt-1 text-sm text-gray-500">Wait for the admin to start a round.</p>
        </div>
      )}

      {/* Round cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((r) => (
          <Link
            key={r}
            to={`/round/${r}`}
            className={`rounded-lg border p-4 transition-colors ${
              eventState?.currentRound === r && eventState.roundStatus === "LIVE"
                ? "border-ghost-gold bg-ghost-gold/5"
                : "border-gray-800 bg-ghost-panel hover:border-gray-600"
            }`}
          >
            <p className="text-sm text-gray-500">Round {r}</p>
            <p className="text-lg font-bold">{roundNames[r]}</p>
            <p className="mt-1 text-xs text-gray-400">{roundDescs[r]}</p>
          </Link>
        ))}
      </div>

      {/* Leaderboard */}
      <section className="mt-8 rounded bg-ghost-panel p-4">
        <h2 className="text-lg font-semibold text-ghost-gold">Leaderboard</h2>
        <div className="mt-3 space-y-1">
          {leaderboard.slice(0, 10).map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
                entry.id === user?.id ? "bg-ghost-gold/10" : "bg-black/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold ${i === 0 ? "text-ghost-gold" : "text-gray-500"}`}>
                  #{i + 1}
                </span>
                <span className={entry.eliminated ? "text-gray-500 line-through" : ""}>
                  {entry.name}
                </span>
                <span className="text-xs text-gray-600">{entry.college}</span>
              </div>
              <span className="font-mono text-ghost-gold">{entry.bits}</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="text-sm text-gray-500">No participants yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
