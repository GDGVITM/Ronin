import { useEffect, useState, useRef, useCallback } from "react";
import { http } from "../api/http";
import { useAuthStore } from "../store/auth.store";
import { connectSocket, getSocket } from "../socket/client";
import { useExamMode } from "../hooks/useExamMode";
import type { QuizPushedQuestion, Matchup } from "../types";

type AnswerAck = {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  correctIndex: number;
};

type PushedQuestionPayload = QuizPushedQuestion & { pushedAt?: string };

type QuizState = "WAITING" | "ANSWERING" | "RESULT";

type LeaderEntry = { userId: string; userName: string; totalQuizPoints: number; bits: number };

export function Round2Page() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [state, setState] = useState<QuizState>("WAITING");
  const [question, setQuestion] = useState<QuizPushedQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerAck | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [lastPushKey, setLastPushKey] = useState<string | null>(null);
  const [submitToast, setSubmitToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [showCorrectPopup, setShowCorrectPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pushKeyOf = (q: PushedQuestionPayload) => `${q.id}:${q.pushedAt ?? ""}`;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const latestAnswerAckRef = useRef<AnswerAck | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const hasSubmittedRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    fullscreenLockActive,
    violationLocked,
    reEnterFullscreen,
  } = useExamMode("Round 2", 2);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await http.get<LeaderEntry[]>("/quiz/leaderboard");
      setLeaderboard(data);
      const me = data.find((entry) => entry.userId === user?.id);
      setTotalScore(me?.totalQuizPoints ?? 0);
    } catch { /* */ }
  }, [user?.id]);

  const syncCurrentQuestion = useCallback(async () => {
    try {
      const { data } = await http.get<PushedQuestionPayload | null>("/quiz/current-question");
      if (!data) return;
      const key = pushKeyOf(data);
      if (key === lastPushKey) return;
      setLastPushKey(key);
      setQuestion(data);
      setSelectedIndex(null);
      selectedIndexRef.current = null;
      hasSubmittedRef.current = false;
      latestAnswerAckRef.current = null;
      setAnswerResult(null);
      setIsSubmitting(false);
      setTimeLeft(data.timeLimit);
      startTimeRef.current = Date.now();
      setState("ANSWERING");
      setQuestionCount((c) => c + 1);
    } catch {
      // Ignore sync errors.
    }
  }, [lastPushKey]);

  // Fetch matchup
  useEffect(() => {
    if (!user) return;
    http.get<Matchup[]>("/round/2/matchups").then(({ data }) => {
      const m = data.find((x) => x.user1.id === user.id || x.user2.id === user.id);
      if (m) setMatchup(m);
    }).catch(() => null);
  }, [user]);

  useEffect(() => {
    let socket = getSocket();
    if (!socket && token) {
      socket = connectSocket(token);
    }
    if (!socket) return;

    socket.emit("room:join", "round2");

    const handleQuestion = (q: PushedQuestionPayload) => {
      const key = pushKeyOf(q);
      if (key === lastPushKey) return;
      setLastPushKey(key);
      setQuestion(q);
      setSelectedIndex(null);
      selectedIndexRef.current = null;
      hasSubmittedRef.current = false;
      latestAnswerAckRef.current = null;
      setAnswerResult(null);
      setIsSubmitting(false);
      setTimeLeft(q.timeLimit);
      startTimeRef.current = Date.now();
      setState("ANSWERING");
      setQuestionCount((c) => c + 1);
    };

    const handleAck = (ack: AnswerAck) => {
      latestAnswerAckRef.current = ack;
    };

    const handleRoundReset = (data: { roundNumber: number }) => {
      if (data.roundNumber !== 2) return;
      if (timerRef.current) clearInterval(timerRef.current);
      setState("WAITING");
      setQuestion(null);
      setSelectedIndex(null);
      selectedIndexRef.current = null;
      hasSubmittedRef.current = false;
      latestAnswerAckRef.current = null;
      setAnswerResult(null);
      setIsSubmitting(false);
      setTimeLeft(0);
      setTotalScore(0);
      setQuestionCount(0);
      fetchLeaderboard();
    };

    const handleRoundStarted = (data: { roundNumber: number }) => {
      if (data.roundNumber !== 2) return;
      fetchLeaderboard();
      void syncCurrentQuestion();
    };

    socket.on("round2:question", handleQuestion);
    socket.on("quiz:answer-ack", handleAck);
    socket.on("round:reset", handleRoundReset);
    socket.on("round:started", handleRoundStarted);
    return () => {
      socket.emit("room:leave", "round2");
      socket.off("round2:question", handleQuestion);
      socket.off("quiz:answer-ack", handleAck);
      socket.off("round:reset", handleRoundReset);
      socket.off("round:started", handleRoundStarted);
    };
  }, [fetchLeaderboard, token, lastPushKey, syncCurrentQuestion]);

  useEffect(() => {
    const poll = setInterval(() => {
      void syncCurrentQuestion();
    }, 1000);

    return () => clearInterval(poll);
  }, [syncCurrentQuestion]);

  useEffect(() => {
    fetchLeaderboard();
    void syncCurrentQuestion();
  }, [fetchLeaderboard, syncCurrentQuestion]);

  useEffect(() => {
    if (state !== "ANSWERING" || !question) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state, question]);

  useEffect(() => {
    if (state !== "ANSWERING" || !question || timeLeft !== 0) return;
    const selected = selectedIndexRef.current;
    if (selected === null) {
      setState("RESULT");
      return;
    }
    const latest = latestAnswerAckRef.current;
    if (latest && latest.questionId === question.id) {
      hasSubmittedRef.current = true;
      setAnswerResult(latest);
      if (latest.isCorrect) setShowCorrectPopup(true);
      setState("RESULT");
      if (timerRef.current) clearInterval(timerRef.current);
      void fetchLeaderboard();
      return;
    }
    void handleAnswer(selected, true);
  }, [state, question, timeLeft]);

  useEffect(() => {
    if (state !== "RESULT" || !question || answerResult) return;
    const selected = selectedIndexRef.current;
    if (selected === null || hasSubmittedRef.current) return;
    void handleAnswer(selected, true);
  }, [state, question, answerResult]);

  useEffect(() => {
    if (state !== "ANSWERING" || !question || selectedIndex === null) return;
    const timer = setTimeout(() => {
      void handleAnswer(selectedIndex, false);
    }, 150);
    return () => clearTimeout(timer);
  }, [state, question, selectedIndex]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showSubmitToast(text: string, tone: "success" | "error") {
    setSubmitToast({ text, tone });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setSubmitToast(null);
    }, 2500);
  }

  async function handleAnswer(index: number, finalize: boolean) {
    if (!question) return;
    if (finalize && hasSubmittedRef.current) return;
    if (finalize) {
      hasSubmittedRef.current = true;
      setIsSubmitting(true);
    }
    const responseTime = Date.now() - startTimeRef.current;
    const maxAttempts = finalize ? 3 : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const { data } = await http.post<AnswerAck>("/quiz/answer", {
          questionId: question.id,
          selectedIndex: index,
          responseTime,
        });

        latestAnswerAckRef.current = data;

        if (finalize) {
          const ts = new Date().toLocaleTimeString();
          showSubmitToast(`Answer submitted at ${ts}`, "success");
          setAnswerResult(data);
          if (data.isCorrect) setShowCorrectPopup(true);
          setState("RESULT");
          if (timerRef.current) clearInterval(timerRef.current);
          void fetchLeaderboard();
          setIsSubmitting(false);
        }
        return;
      } catch {
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          continue;
        }
      }
      if (!finalize) {
        return;
      }
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
      showSubmitToast("Submission failed. Please try again.", "error");
      setState("RESULT");
      return;
    }
  }

  const opponent = matchup
    ? (matchup.user1.id === user?.id ? matchup.user2 : matchup.user1)
    : null;
  const timerPercent = question ? (timeLeft / question.timeLimit) * 100 : 0;

  useEffect(() => {
    if (!showCorrectPopup) return;
    const id = setTimeout(() => setShowCorrectPopup(false), 1800);
    return () => clearTimeout(id);
  }, [showCorrectPopup]);

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col text-white">

      {/* Fullscreen required overlay */}
      {fullscreenLockActive && !violationLocked && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full p-10 text-center border border-ghost-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.25)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ghost-gold/10 border border-ghost-gold/30">
              <svg className="h-8 w-8 text-ghost-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-ghost-gold mb-2">Fullscreen Required</h2>
            <p className="text-sm text-gray-300 mb-1">You exited fullscreen mode.</p>
            <p className="text-xs text-gray-500 mb-7">Re-enter fullscreen to continue the quiz.</p>
            <button
              className="w-full rounded-xl bg-ghost-gold py-3 text-sm font-bold text-black hover:opacity-90 transition"
              onClick={() => void reEnterFullscreen()}
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {showCorrectPopup && (
        <div className="fixed inset-0 z-[68] flex items-center justify-center bg-black/50 p-6">
          <div className="rounded-xl border border-ghost-green/60 bg-ghost-panel px-10 py-8 text-center shadow-[0_0_32px_rgba(46,204,113,0.35)]">
            <h2 className="text-4xl font-bold text-ghost-green">CORRECT</h2>
            <p className="mt-2 text-sm text-gray-300">Great pick. Points awarded.</p>
          </div>
        </div>
      )}

      {submitToast && (
        <div className="pointer-events-none fixed right-4 top-20 z-[65]">
          <div className={`rounded-lg px-4 py-2 text-sm shadow-lg ${submitToast.tone === "success" ? "bg-ghost-green/20 text-ghost-green border border-ghost-green/40" : "bg-ghost-red/20 text-ghost-red border border-ghost-red/40"}`}>
            {submitToast.text}
          </div>
        </div>
      )}



      {/* Header */}
      <div className="border-b border-gray-800 bg-ghost-panel px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-ghost-gold">Shrine Of Wisdom — Debug MCQ</h1>
            {opponent && (
              <>
                <span className="text-sm text-gray-400">vs</span>
                <span className="font-semibold text-ghost-red">{opponent.name}</span>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Question {questionCount}</p>
            <p className="text-lg font-bold text-ghost-gold">{totalScore} pts</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {state === "WAITING" && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-6 h-16 w-16 animate-pulse rounded-full bg-ghost-gold/20" />
                <h2 className="text-2xl font-bold text-gray-300">Waiting for next question...</h2>
                <p className="mt-2 text-gray-500">The admin will push debugging questions in real-time.</p>
              </div>
            </div>
          )}

          {state === "ANSWERING" && question && (
            <div className="mx-auto w-full max-w-3xl">
              {/* Timer */}
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timerPercent > 50 ? "bg-ghost-green" : timerPercent > 20 ? "bg-ghost-gold" : "bg-ghost-red"
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
              <p className="mb-4 text-center text-sm text-gray-400">{timeLeft}s remaining</p>

              {/* Code snippet */}
              {question.codeSnippet && (
                <div className="mb-6 rounded-lg bg-[#1e1e1e] p-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">BUGGY CODE:</p>
                  <pre className="overflow-x-auto whitespace-pre text-sm leading-relaxed text-gray-200">
                    <code>{question.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Question */}
              <h2 className="mb-6 text-lg font-semibold">{question.questionText}</h2>

              {/* Options */}
              <div className="grid gap-3">
                {(question.options as string[]).map((option, i) => (
                  <button
                    key={i}
                    className={`rounded-lg border-2 p-4 text-left text-sm font-medium transition-all ${
                      selectedIndex === i
                        ? "border-ghost-gold bg-ghost-gold/20 text-ghost-gold ring-2 ring-ghost-gold/35"
                        : "border-gray-700 bg-ghost-panel hover:border-gray-500"
                    } ${hasSubmittedRef.current || isSubmitting ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => setSelectedIndex(i)}
                    disabled={violationLocked || hasSubmittedRef.current || isSubmitting}
                  >
                    <span className="mr-3 font-bold text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    {option}
                    {selectedIndex === i && <span className="ml-3 text-xs font-semibold text-ghost-gold">(selected)</span>}
                  </button>
                ))}
              </div>
              {isSubmitting && <p className="mt-3 text-center text-xs text-ghost-gold">Submitting your answer...</p>}
            </div>
          )}

          {state === "RESULT" && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                {answerResult ? (
                  <>
                    <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                      answerResult.isCorrect ? "bg-ghost-green/20 text-ghost-green" : "bg-ghost-red/20 text-ghost-red"
                    }`}>
                      <span className="text-3xl">{answerResult.isCorrect ? "+" : "X"}</span>
                    </div>
                    <h2 className="text-2xl font-bold">
                      {answerResult.isCorrect
                        ? <span className="text-ghost-green">Correct!</span>
                        : <span className="text-ghost-red">Wrong!</span>}
                    </h2>
                    {answerResult.isCorrect && <p className="mt-2 text-ghost-gold">+{answerResult.pointsEarned} points</p>}
                    {!answerResult.isCorrect && question && (
                      <p className="mt-2 text-gray-400">
                        Answer: {String.fromCharCode(65 + answerResult.correctIndex)}. {(question.options as string[])[answerResult.correctIndex]}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-ghost-red">Time's up!</h2>
                    <p className="mt-2 text-gray-400">You didn't answer in time.</p>
                  </>
                )}
                <p className="mt-6 text-gray-500">Waiting for next question...</p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <div className="w-64 border-l border-gray-800 bg-ghost-panel p-4">
          <h3 className="text-sm font-semibold text-ghost-gold">Quiz Scores</h3>
          <div className="mt-3 space-y-1">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
                  entry.userId === user?.id ? "bg-ghost-gold/10" : "bg-black/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${i === 0 ? "text-ghost-gold" : "text-gray-500"}`}>#{i + 1}</span>
                  <span className="truncate">{entry.userName}</span>
                </div>
                <span className="font-mono text-ghost-gold">{entry.totalQuizPoints}</span>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-xs text-gray-500">No scores yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
