import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/lib/types";
import { formatBytes, formatDuration, formatRelativeTime } from "@/lib/format";
import { getSessionReplayUrl } from "@/lib/api";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  RUNNING: "default",
  COMPLETED: "secondary",
  ERROR: "destructive",
  TIMED_OUT: "outline",
};

export const columns: ColumnDef<Session>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      return (
        <Badge variant={statusVariant[status] ?? "outline"}>{status}</Badge>
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
    cell: ({ row }) => {
      const id = row.getValue<string>("id");
      return (
        <span className="font-mono text-xs" title={id}>
          {id.slice(0, 8)}...
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => formatRelativeTime(row.getValue("createdAt")),
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
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Duration
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) =>
      formatDuration(row.original.startedAt, row.original.endedAt),
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
      <span className="text-xs">{row.getValue<string>("region") || "-"}</span>
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
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Proxy
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => formatBytes(row.getValue<number>("proxyBytes") ?? 0),
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
