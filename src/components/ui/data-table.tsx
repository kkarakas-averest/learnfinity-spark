import React from "@/lib/react-helpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define a type for the column with more flexible accessorKey requirement
export interface DataTableColumn<TData> {
  id?: string;
  accessorKey?: string;
  header?: string;
  cell?: (props: { row: TData }) => React.ReactNode;
}

// Ensure at least one of id or accessorKey is present
export type ValidDataTableColumn<TData> = 
  | (DataTableColumn<TData> & { id: string })
  | (DataTableColumn<TData> & { accessorKey: string });

interface DataTableProps<TData> {
  columns: ValidDataTableColumn<TData>[];
  data: TData[];
}

export function DataTable<TData>({
  columns,
  data,
}: DataTableProps<TData>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id || column.accessorKey || Math.random().toString()}>
                {column.header || column.accessorKey || column.id}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.cell 
                    ? column.cell({ row })
                    : column.accessorKey 
                      ? (row as Record<string, unknown>)[column.accessorKey]
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
