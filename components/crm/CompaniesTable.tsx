'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Company } from '@/lib/crm/types';
import { MoreHorizontal, Edit, Trash, Building } from 'lucide-react';
import Link from 'next/link';
import { deleteCompany } from '@/app/crm/actions/companies';
import { useRouter } from 'next/navigation';

interface CompaniesTableProps {
  initialData: Company[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  filters: any;
}

export default function CompaniesTable({
  initialData,
  totalCount,
  currentPage,
  hasMore,
  filters,
}: CompaniesTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const columns = useMemo<ColumnDef<Company>[]>(
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
            href={`/crm/companies/${row.original.id}`}
            className="text-blue-600 hover:underline font-medium flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'industry',
        header: 'Industry',
      },
      {
        accessorKey: 'size',
        header: 'Size',
      },
      {
        accessorKey: 'website',
        header: 'Website',
        cell: ({ getValue }) => {
          const website = getValue() as string;
          return website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {website}
            </a>
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
              href={`/crm/companies/${row.original.id}/edit`}
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
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    const result = await deleteCompany(id);
    if (result.success) {
      setData(data.filter(c => c.id !== id));
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
          Showing {data.length} of {totalCount} companies
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