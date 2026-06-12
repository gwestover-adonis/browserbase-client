import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/lib/types";
import { formatBytes, formatDuration, formatRelativeTime } from "@/lib/format";
import { getSessionReplayUrl } from "@/lib/api";
import { getStatusConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import { CopyableId } from "./CopyableId";

export const columns: ColumnDef<Session>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      const cfg = getStatusConfig(status);
      return (
        <div className="flex items-center gap-2">
          <div className={cn("w-1 self-stretch rounded-full shrink-0", cfg.accentClass)} />
          <Badge variant={cfg.badgeVariant} className={cn("border", cfg.className)}>
            {cfg.label}
          </Badge>
        </div>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "ALL") return true;
      return row.getValue("status") === filterValue;
    },
  },
  {
    accessorKey: "id",
    header: "Session ID",
    cell: ({ row }) => <CopyableId id={row.getValue<string>("id")} truncate={8} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono">{formatRelativeTime(row.getValue("createdAt"))}</span>,
    sortingFn: "datetime",
    filterFn: (row, _columnId, filterValue) => {
      const { after, before } = filterValue as {
        after?: string;
        before?: string;
      };
      const created = new Date(row.getValue<string>("createdAt")).getTime();
      if (after && created < new Date(after).getTime()) return false;
      if (before && created > new Date(before + "T23:59:59").getTime())
        return false;
      return true;
    },
  },
  {
    id: "duration",
    accessorFn: (row) => {
      if (!row.startedAt) return null;
      const start = new Date(row.startedAt).getTime();
      const end = row.endedAt ? new Date(row.endedAt).getTime() : Date.now();
      return (end - start) / 1000;
    },
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Duration
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono">{formatDuration(row.original.startedAt, row.original.endedAt)}</span>
    ),
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue<number | null>("duration") ?? 0;
      const b = rowB.getValue<number | null>("duration") ?? 0;
      return a - b;
    },
    filterFn: (row, _columnId, filterValue) => {
      const val = row.getValue<number | null>("duration");
      if (val === null) return false;
      const { min, max } = filterValue as { min?: number; max?: number };
      if (min != null && val < min) return false;
      if (max != null && val > max) return false;
      return true;
    },
  },
  {
    accessorKey: "region",
    header: "Region",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue<string>("region") || "-"}</span>
    ),
    filterFn: (row, _columnId, filterValue) => {
      const regions = filterValue as string[];
      if (!regions || regions.length === 0) return true;
      return regions.includes(row.getValue<string>("region"));
    },
  },
  {
    accessorKey: "proxyBytes",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Proxy
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono">{formatBytes(row.getValue<number>("proxyBytes") ?? 0)}</span>,
    filterFn: (row, _columnId, filterValue) => {
      const bytes = row.getValue<number>("proxyBytes") ?? 0;
      const { min, max } = filterValue as { min?: number; max?: number };
      if (min != null && bytes < min) return false;
      if (max != null && bytes > max) return false;
      return true;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <a
        href={getSessionReplayUrl(row.original.id)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon-xs">
          <ExternalLink className="size-3.5" />
          <span className="sr-only">View replay</span>
        </Button>
      </a>
    ),
  },
];
