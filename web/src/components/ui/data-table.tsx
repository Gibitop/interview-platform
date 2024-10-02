import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    type RowData,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Loader2 } from 'lucide-react';
import { cn } from '~/utils/shadcn';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    noResultsMessage?: React.ReactNode;
}

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        noPadding?: boolean;
    }
}

export function DataTable<TData, TValue>({
    columns,
    isLoading,
    data,
    noResultsMessage,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md">
            <Table className="border-separate border-spacing-x-0 border-spacing-y-1">
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header, headerIndex, headers) => (
                                <TableHead
                                    key={header.id}
                                    className={cn(
                                        'mt-2',
                                        headerIndex === 0 && 'rounded-l-xl',
                                        headerIndex === headers.length - 1 && 'rounded-r-xl',
                                    )}
                                >
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
                    <TableRow>
                        <TableCell
                            colSpan={columns.length}
                            className="h-px bg-neutral-600 border-spacing-0 p-0"
                        />
                    </TableRow>
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={columns.length + 1} className="h-24">
                                <div className="grid place-items-center">
                                    <Loader2 className="animate-spin" />
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                    {!isLoading &&
                        !!table.getRowModel().rows?.length &&
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                {row.getVisibleCells().map((cell, cellIndex, cells) => (
                                    <TableCell
                                        key={cell.id}
                                        className={cn(
                                            'mt-2',
                                            cellIndex === 0 && 'rounded-l-xl',
                                            cellIndex === cells.length - 1 && 'rounded-r-xl',
                                            cell.column.columnDef.meta?.noPadding && 'p-0',
                                        )}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    {!isLoading && !table.getRowModel().rows?.length && (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {noResultsMessage ?? 'No results'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
