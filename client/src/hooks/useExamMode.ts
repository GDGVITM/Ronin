import { useEffect, useMemo, useRef, useState } from "react";
import { http } from "../api/http";
import { getSocket } from "../socket/client";

export function useExamMode(roundLabel: string, roundNumber: number, active = true) {
  const [fullscreenActive, setFullscreenActive] = useState<boolean>(Boolean(document.fullscreenElement));
  const [fullscreenExitLocked, setFullscreenExitLocked] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violationLocked, setViolationLocked] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [bannedMessage, setBannedMessage] = useState("");
  const [fullscreenHelpMessage, setFullscreenHelpMessage] = useState("");
  const tabSwitchCountRef = useRef(0);
  const seenFullscreenRef = useRef(Boolean(document.fullscreenElement));

  const warningText = useMemo(
    () => `Exam mode is active for ${roundLabel}. Stay in fullscreen and do not switch tabs.`,
    [roundLabel]
  );

  useEffect(() => {
    if (!active) {
      setFullscreenExitLocked(false);
      setWarningMessage("");
      return;
    }

    const requestFullscreen = async () => {
      if (document.fullscreenElement) {
        setFullscreenActive(true);
        setFullscreenHelpMessage("");
        seenFullscreenRef.current = true;
        getSocket()?.emit("exam:status:update", {
          roundNumber,
          fullscreen: true,
          tabSwitchCount: tabSwitchCountRef.current,
          eventType: "STATUS",
        });
        return;
      }

      try {
        const el = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void> | void;
          msRequestFullscreen?: () => Promise<void> | void;
        };

        if (typeof el.requestFullscreen === "function") {
          await el.requestFullscreen();
        } else if (typeof el.webkitRequestFullscreen === "function") {
          await el.webkitRequestFullscreen();
        } else if (typeof el.msRequestFullscreen === "function") {
          await el.msRequestFullscreen();
        } else {
          throw new Error("Fullscreen API unavailable");
        }

        setFullscreenActive(true);
        setFullscreenHelpMessage("");
        seenFullscreenRef.current = true;
        setFullscreenExitLocked(false);
        getSocket()?.emit("exam:status:update", {
          roundNumber,
          fullscreen: true,
          tabSwitchCount: tabSwitchCountRef.current,
          eventType: "STATUS",
        });
      } catch {
        setFullscreenActive(false);
        setFullscreenHelpMessage("Fullscreen was blocked by browser. Click the button again or press F11.");
        getSocket()?.emit("exam:status:update", {
          roundNumber,
          fullscreen: false,
          tabSwitchCount: tabSwitchCountRef.current,
          eventType: "STATUS",
        });
      }
    };

    const bootstrapStatus = async () => {
      try {
        const { data } = await http.get<{
          roundNumber: number;
          fullscreen: boolean;
          tabSwitchCount: number;
          warned: boolean;
          banned: boolean;
        }>(`/round/${roundNumber}/proctoring/me`);
        setTabSwitchCount(data.tabSwitchCount);
        tabSwitchCountRef.current = data.tabSwitchCount;
        setViolationLocked(data.banned);
        if (data.banned) {
          setBannedMessage("You are banned due to multiple tab switches");
        }
      } catch {
        // Ignore bootstrap failures; live socket updates will still work.
      }
    };

    const onFullscreenChange = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      setFullscreenActive(fullscreen);
      if (fullscreen) {
        seenFullscreenRef.current = true;
        setFullscreenExitLocked(false);
      } else if (seenFullscreenRef.current) {
        // Lock only after user has entered fullscreen at least once, then exits (e.g. Esc).
        setFullscreenExitLocked(true);
      }
      getSocket()?.emit("exam:status:update", {
        roundNumber,
        fullscreen,
        tabSwitchCount: tabSwitchCountRef.current,
        eventType: "STATUS",
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          tabSwitchCountRef.current = next;
          getSocket()?.emit("exam:status:update", {
            roundNumber,
            fullscreen: Boolean(document.fullscreenElement),
            tabSwitchCount: next,
            eventType: "TAB_SWITCH",
          });
          return next;
        });
      } else {
        getSocket()?.emit("exam:status:update", {
          roundNumber,
          fullscreen: Boolean(document.fullscreenElement),
          tabSwitchCount: tabSwitchCountRef.current,
          eventType: "STATUS",
        });
      }
    };

    const socket = getSocket();
    const onWarning = (payload: { roundNumber: number; message: string }) => {
      if (payload.roundNumber !== roundNumber) return;
      setWarningMessage(payload.message);
    };

    const onBanned = (payload: { roundNumber: number; message: string }) => {
      if (payload.roundNumber !== roundNumber) return;
      setViolationLocked(true);
      setBannedMessage(payload.message);
    };

    const onUnblocked = (payload: { roundNumber: number }) => {
      if (payload.roundNumber !== roundNumber) return;
      setViolationLocked(false);
      setBannedMessage("");
      setWarningMessage("");
      setTabSwitchCount(0);
      tabSwitchCountRef.current = 0;
    };

    socket?.on("exam:warning", onWarning);
    socket?.on("exam:banned", onBanned);
    socket?.on("exam:unblocked", onUnblocked);

    void bootstrapStatus();
    requestFullscreen();
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket?.off("exam:warning", onWarning);
      socket?.off("exam:banned", onBanned);
      socket?.off("exam:unblocked", onUnblocked);
    };
  }, [roundNumber, active]);

  const reEnterFullscreen = async () => {
    if (!active) return;
    if (document.fullscreenElement) return;
    try {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };

      if (typeof el.requestFullscreen === "function") {
        await el.requestFullscreen();
      } else if (typeof el.webkitRequestFullscreen === "function") {
        await el.webkitRequestFullscreen();
      } else if (typeof el.msRequestFullscreen === "function") {
        await el.msRequestFullscreen();
      } else {
        throw new Error("Fullscreen API unavailable");
      }

      setFullscreenActive(true);
      setFullscreenHelpMessage("");
      seenFullscreenRef.current = true;
      setFullscreenExitLocked(false);
      getSocket()?.emit("exam:status:update", {
        roundNumber,
        fullscreen: true,
        tabSwitchCount: tabSwitchCountRef.current,
        eventType: "STATUS",
      });
    } catch {
      setFullscreenActive(false);
      setFullscreenHelpMessage("Unable to enter fullscreen. Use F11 and return to the contest tab.");
      getSocket()?.emit("exam:status:update", {
        roundNumber,
        fullscreen: false,
        tabSwitchCount: tabSwitchCountRef.current,
        eventType: "STATUS",
      });
    }
  };

  return {
    fullscreenActive,
    fullscreenLockActive: fullscreenExitLocked,
    tabSwitchCount,
    violationLocked,
    warningMessage,
    bannedMessage,
    fullscreenHelpMessage,
    clearWarning: () => setWarningMessage(""),
    warningText,
    reEnterFullscreen,
  };
}
