import { useEffect, useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSession, getSessionReplayUrl } from "@/lib/api";
import { formatBytes, formatDuration, formatTimestamp } from "@/lib/format";
import type { Session } from "@/lib/types";
import { SessionLogs } from "./SessionLogs";

interface SessionDetailProps {
  session: Session | null;
  open: boolean;
  onClose: () => void;
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  RUNNING: "default",
  COMPLETED: "secondary",
  ERROR: "destructive",
  TIMED_OUT: "outline",
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-primary"
      title="Copy full ID"
    >
      <span>{id.slice(0, 12)}...</span>
      {copied ? (
        <Check className="size-3 text-green-600" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}

export function SessionDetail({ session, open, onClose }: SessionDetailProps) {
  const [fullSession, setFullSession] = useState<Session | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  useEffect(() => {
    if (session?.id) {
      getSession(session.id).then(setFullSession).catch(console.error);
      setShowLogs(false);
    } else {
      setFullSession(null);
    }
  }, [session?.id]);

  const s = fullSession ?? session;

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Session Detail
            {s && (
              <Badge variant={statusVariant[s.status] ?? "outline"}>
                {s.status}
              </Badge>
            )}
          </SheetTitle>
          {s && <SheetDescription>{s.id}</SheetDescription>}
        </SheetHeader>

        {s && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <a
              href={getSessionReplayUrl(s.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 size-4" />
                View Session Replay
              </Button>
            </a>

            <Separator />

            <div>
              <h3 className="mb-2 text-sm font-semibold">General</h3>
              <DetailRow label="Session ID">
                <CopyableId id={s.id} />
              </DetailRow>
              <DetailRow label="Project ID">
                <CopyableId id={s.projectId} />
              </DetailRow>
              <DetailRow label="Region">{s.region || "-"}</DetailRow>
              <DetailRow label="Keep Alive">
                {s.keepAlive ? "Yes" : "No"}
              </DetailRow>
              {s.contextId && (
                <DetailRow label="Context ID">
                  <CopyableId id={s.contextId} />
                </DetailRow>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 text-sm font-semibold">Timing</h3>
              <DetailRow label="Created">{formatTimestamp(s.createdAt)}</DetailRow>
              <DetailRow label="Started">{formatTimestamp(s.startedAt)}</DetailRow>
              <DetailRow label="Ended">{formatTimestamp(s.endedAt)}</DetailRow>
              <DetailRow label="Duration">
                {formatDuration(s.startedAt, s.endedAt)}
              </DetailRow>
              <DetailRow label="Expires">{formatTimestamp(s.expiresAt)}</DetailRow>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 text-sm font-semibold">Resources</h3>
              <DetailRow label="Proxy Bytes">
                {formatBytes(s.proxyBytes ?? 0)}
              </DetailRow>
              <DetailRow label="Avg CPU">{s.avgCpuUsage ?? "-"}%</DetailRow>
              <DetailRow label="Memory">
                {formatBytes(s.memoryUsage ?? 0)}
              </DetailRow>
            </div>

            {s.userMetadata && Object.keys(s.userMetadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-semibold">User Metadata</h3>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <JsonView
                      data={s.userMetadata}
                      shouldExpandNode={(level) => level < 2}
                      style={isDark ? darkStyles : defaultStyles}
                    />
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Session Logs</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  {showLogs ? "Hide Logs" : "Show Logs"}
                </Button>
              </div>
              {showLogs && <SessionLogs sessionId={s.id} />}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
