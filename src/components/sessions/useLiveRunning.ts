import { useEffect, useRef, useState } from "react";
import { listSessions } from "@/lib/api";
import type { Session } from "@/lib/types";

const POLL_MS = 10_000;

export function useLiveRunning() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = () => {
    listSessions({ status: "RUNNING" })
      .then(setSessions)
      .catch(() => {});
  };

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return sessions;
}
