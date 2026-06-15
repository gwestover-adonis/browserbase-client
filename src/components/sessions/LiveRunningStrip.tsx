import { useEffect, useRef, useState } from "react";
import { listSessions } from "@/lib/api";
import type { Session } from "@/lib/types";

const POLL_MS = 10_000;

export function useLiveRunning(enabled: boolean) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSessions([]);
      return;
    }

    const poll = () => {
      listSessions({ status: "RUNNING" })
        .then(setSessions)
        .catch(() => {});
    };

    poll();
    timerRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled]);

  return sessions;
}
