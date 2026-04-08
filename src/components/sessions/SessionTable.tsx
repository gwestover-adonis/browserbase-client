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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
    <div>
      <div className="overflow-hidden rounded-lg border">
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
      </div>

      <div className="flex items-center justify-between py-4">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} session(s) total
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
