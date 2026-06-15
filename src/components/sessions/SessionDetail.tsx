import { useEffect, useState } from "react";
import { ExternalLink, Maximize2, Minimize2, Monitor } from "lucide-react";
import { CopyableId } from "./CopyableId";
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
import { getSession, getSessionDebug, getSessionReplayUrl } from "@/lib/api";
import { formatBytes, formatDuration, formatTimestamp } from "@/lib/format";
import type { Session, SessionDebugInfo } from "@/lib/types";
import { getStatusConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import { SessionLogs } from "./SessionLogs";

interface SessionDetailProps {
  session: Session | null;
  open: boolean;
  onClose: () => void;
}

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


export function SessionDetail({ session, open, onClose }: SessionDetailProps) {
  const [fullSession, setFullSession] = useState<Session | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [debugInfo, setDebugInfo] = useState<SessionDebugInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  useEffect(() => {
    if (session?.id) {
      getSession(session.id).then(setFullSession).catch(console.error);
      setShowLogs(false);
      setShowPreview(false);
      setDebugInfo(null);
      if (session.status === "RUNNING") {
        getSessionDebug(session.id).then(setDebugInfo).catch(() => {});
      }
    } else {
      setFullSession(null);
      setDebugInfo(null);
    }
  }, [session?.id, session?.status]);

  const s = fullSession ?? session;

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Session Detail
            {s && (() => {
              const cfg = getStatusConfig(s.status);
              return (
                <Badge variant={cfg.badgeVariant} className={cn("border", cfg.className)}>
                  {cfg.label}
                </Badge>
              );
            })()}
          </SheetTitle>
          {s && <SheetDescription>{s.id}</SheetDescription>}
        </SheetHeader>

        {s && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex gap-2">
              <a
                href={getSessionReplayUrl(s.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="mr-2 size-4" />
                  View Session Replay
                </Button>
              </a>
              {debugInfo && (
                <Button
                  variant="outline"
                  size="icon"
                  title={showPreview ? "Hide live preview" : "Show live preview"}
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? <Minimize2 className="size-4" /> : <Monitor className="size-4" />}
                </Button>
              )}
            </div>

            {showPreview && debugInfo && (
              <div className="rounded-lg border overflow-hidden">
                <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 border-b">
                  <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
                  <a
                    href={debugInfo.debuggerFullscreenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Maximize2 className="size-3" />
                  </a>
                </div>
                <iframe
                  src={debugInfo.debuggerUrl}
                  title="Session live preview"
                  className="w-full"
                  style={{ height: 320 }}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            )}


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
