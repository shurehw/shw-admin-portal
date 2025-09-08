'use client';

import { useState, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Deal } from '@/lib/crm/types';
import { DollarSign, Calendar, TrendingUp, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { deleteDeal } from '@/app/crm/actions/deals';
import { useRouter } from 'next/navigation';

interface DealsTableProps {
  initialData: Deal[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  filters: any;
}

export default function DealsTable({
  initialData,
  totalCount,
  currentPage,
  hasMore,
  filters,
}: DealsTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const columns = useMemo<ColumnDef<Deal>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300"
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/crm/deals/${row.original.id}`}
            className="text-blue-600 hover:underline font-medium"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ getValue }) => {
          const amount = getValue() as number;
          return (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(amount || 0)}
            </div>
          );
        },
      },
      {
        accessorKey: 'stage',
        header: 'Stage',
        cell: ({ getValue }) => {
          const stage = getValue() as string;
          const stageColors: Record<string, string> = {
            lead: 'bg-gray-100 text-gray-800',
            qualified: 'bg-blue-100 text-blue-800',
            proposal: 'bg-yellow-100 text-yellow-800',
            negotiation: 'bg-purple-100 text-purple-800',
            closed_won: 'bg-green-100 text-green-800',
            closed_lost: 'bg-red-100 text-red-800',
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors[stage] || 'bg-gray-100'}`}>
              {stage.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'probability',
        header: 'Probability',
        cell: ({ getValue }) => {
          const probability = getValue() as number;
          return (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              {probability}%
            </div>
          );
        },
      },
      {
        accessorKey: 'expected_close_date',
        header: 'Expected Close',
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return date ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              {new Date(date).toLocaleDateString()}
            </div>
          ) : null;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return new Date(date).toLocaleDateString();
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/crm/deals/${row.original.id}/edit`}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 hover:bg-gray-100 rounded text-red-600"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        ),
        size: 80,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    const result = await deleteDeal(id);
    if (result.success) {
      setData(data.filter(d => d.id !== id));
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1" ref={parentRef}>
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="border-t px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {data.length} of {totalCount} deals
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`?page=${currentPage - 1}`)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => router.push(`?page=${currentPage + 1}`)}
            disabled={!hasMore}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}