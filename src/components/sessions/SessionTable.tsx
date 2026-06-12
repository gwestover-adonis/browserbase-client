import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Table as ReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function Pagination<T>({ table }: { table: ReactTable<T> }) {
  const current = table.getState().pagination.pageIndex + 1;
  const total = table.getPageCount();
  if (total <= 1) return null;
  const pages = getPageNumbers(current, total);
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
        <ChevronsLeft className="size-4" />
      </Button>
      <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground select-none">…</span>
        ) : (
          <Button
            key={p}
            variant={p === current ? "default" : "outline"}
            size="icon"
            className="size-8 text-xs"
            onClick={() => table.setPageIndex((p as number) - 1)}
          >
            {p}
          </Button>
        )
      )}
      <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
        <ChevronRight className="size-4" />
      </Button>
      <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(total - 1)} disabled={!table.getCanNextPage()}>
        <ChevronsRight className="size-4" />
      </Button>
    </div>
  );
}
import type { PropertyFilters } from "@/lib/property-filters";

const PROPERTY_FILTER_COLUMNS = [
  "createdAt",
  "duration",
  "region",
  "proxyBytes",
] as const;

interface SessionTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  statusFilter?: string;
  propertyFilters?: PropertyFilters;
}

export function SessionTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  statusFilter,
  propertyFilters,
}: SessionTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.id !== "status");
      if (statusFilter && statusFilter !== "ALL") {
        return [...without, { id: "status", value: statusFilter }];
      }
      return without;
    });
  }, [statusFilter]);

  useEffect(() => {
    setColumnFilters((prev) => {
      const without = prev.filter(
        (f) => !PROPERTY_FILTER_COLUMNS.includes(f.id as typeof PROPERTY_FILTER_COLUMNS[number]),
      );
      if (!propertyFilters) return without;

      const next = [...without];

      if (propertyFilters.createdAfter || propertyFilters.createdBefore) {
        next.push({
          id: "createdAt",
          value: {
            after: propertyFilters.createdAfter,
            before: propertyFilters.createdBefore,
          },
        });
      }

      if (propertyFilters.durationMin != null || propertyFilters.durationMax != null) {
        next.push({
          id: "duration",
          value: {
            min: propertyFilters.durationMin,
            max: propertyFilters.durationMax,
          },
        });
      }

      if (propertyFilters.regions && propertyFilters.regions.length > 0) {
        next.push({ id: "region", value: propertyFilters.regions });
      }

      if (propertyFilters.proxyBytesMin != null || propertyFilters.proxyBytesMax != null) {
        next.push({
          id: "proxyBytes",
          value: {
            min: propertyFilters.proxyBytesMin,
            max: propertyFilters.proxyBytesMax,
          },
        });
      }

      return next;
    });
  }, [propertyFilters]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0 rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No sessions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex items-center justify-between py-4 shrink-0">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {data.length} sessions
        </p>
        <Pagination table={table} />
      </div>
    </div>
  );
}
