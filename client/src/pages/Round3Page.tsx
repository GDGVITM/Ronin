import { useEffect, useState } from "react";
import { http } from "../api/http";
import type { Problem } from "../types";

export function Round3Page() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selected, setSelected] = useState<Problem | null>(null);

  useEffect(() => {
    http.get<Problem[]>("/round/3/problems").then(({ data }) => {
      setProblems(data);
      if (data.length > 0) setSelected(data[0]);
    }).catch(() => null);
  }, []);

  if (problems.length === 0) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ghost-gold">Round 3 — Khan's Ultimatum</h1>
          <p className="mt-4 text-gray-400">MVP Building Round</p>
          <p className="mt-1 text-sm text-gray-500">Waiting for problem statements to be published...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] text-white">
      <div className="border-b border-gray-800 bg-ghost-panel px-6 py-4">
        <h1 className="text-2xl font-bold text-ghost-gold">Round 3 — MVP Building</h1>
        <p className="mt-1 text-sm text-gray-400">
          Choose a problem statement and build your MVP on VS Code. Use any tools, frameworks, or AI assistance.
        </p>
      </div>

      <div className="mx-auto max-w-5xl p-6">
        {/* Problem selector tabs */}
        <div className="flex gap-2">
          {problems.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                selected?.id === p.id
                  ? "bg-ghost-panel text-ghost-gold border-b-2 border-ghost-gold"
                  : "bg-black/20 text-gray-400 hover:text-white"
              }`}
            >
              Problem {i + 1}
            </button>
          ))}
        </div>

        {/* Problem statement */}
        {selected && (
          <div className="rounded-b-lg rounded-tr-lg bg-ghost-panel p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{selected.title}</h2>
              <span className="rounded bg-ghost-gold/20 px-2 py-0.5 text-xs font-semibold text-ghost-gold">
                {selected.difficulty}
              </span>
            </div>
            <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {selected.description}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 rounded-lg border border-gray-800 bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-ghost-gold">Instructions</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-400">
            <li>1. Read the problem statement carefully</li>
            <li>2. Open VS Code and start building your MVP</li>
            <li>3. You may use any framework, library, or AI tool</li>
            <li>4. Focus on working functionality and clean UI</li>
            <li>5. Submit your project before the time runs out</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
