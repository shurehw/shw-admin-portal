'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Contact, QueryFilters } from '@/lib/crm/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronDown, ChevronUp, Mail, Phone, Building2, 
  MoreHorizontal, Edit, Trash2, Merge, CheckSquare
} from 'lucide-react';
import { deleteContact, bulkUpdateLifecycleStage } from '@/app/(crm)/crm/actions/contacts';

interface ContactsTableProps {
  initialData: Contact[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  filters: QueryFilters;
}

export default function ContactsTable({
  initialData,
  totalCount,
  currentPage,
  hasMore,
  filters,
}: ContactsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Define columns
  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            className="rounded border-gray-300"
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'full_name',
        header: 'Name',
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <div>
              <button
                onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {contact.full_name || contact.email}
              </button>
              {contact.title && (
                <div className="text-sm text-gray-500">{contact.title}</div>
              )}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <a
            href={`mailto:${getValue()}`}
            className="text-gray-900 hover:text-blue-600 flex items-center gap-1"
          >
            <Mail className="h-4 w-4" />
            {getValue() as string}
          </a>
        ),
        size: 200,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => {
          const phone = getValue() as string;
          return phone ? (
            <a
              href={`tel:${phone}`}
              className="text-gray-900 hover:text-blue-600 flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
              {phone}
            </a>
          ) : (
            <span className="text-gray-400">—</span>
          );
        },
        size: 150,
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => {
          const company = row.original.company;
          return company ? (
            <button
              onClick={() => router.push(`/crm/companies/${company.id}`)}
              className="text-gray-900 hover:text-blue-600 flex items-center gap-1"
            >
              <Building2 className="h-4 w-4" />
              {company.name}
            </button>
          ) : (
            <span className="text-gray-400">—</span>
          );
        },
        size: 180,
      },
      {
        accessorKey: 'lifecycle_stage',
        header: 'Lifecycle Stage',
        cell: ({ getValue }) => {
          const stage = getValue() as string;
          const stageColors: Record<string, string> = {
            lead: 'bg-gray-100 text-gray-800',
            mql: 'bg-blue-100 text-blue-800',
            sql: 'bg-indigo-100 text-indigo-800',
            opportunity: 'bg-yellow-100 text-yellow-800',
            customer: 'bg-green-100 text-green-800',
            evangelist: 'bg-purple-100 text-purple-800',
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                stageColors[stage] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {stage}
            </span>
          );
        },
        size: 130,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-500 text-sm">
              {date.toLocaleDateString()}
            </span>
          );
        },
        size: 100,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <div className="relative group">
              <button className="p-1 rounded hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
                <div className="py-1">
                  <button
                    onClick={() => router.push(`/crm/contacts/${contact.id}/edit`)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this contact?')) {
                        await deleteContact(contact.id);
                        router.refresh();
                      }
                    }}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        },
        size: 50,
      },
    ],
    [router]
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handle bulk actions
  const handleBulkLifecycleUpdate = async (stage: string) => {
    const selectedRows = table.getSelectedRowModel().rows;
    const contactIds = selectedRows.map(row => row.original.id);
    
    if (contactIds.length === 0) return;
    
    setIsLoading(true);
    await bulkUpdateLifecycleStage(contactIds, stage);
    router.refresh();
    setIsLoading(false);
    setRowSelection({});
  };

  // Virtualization setup
  const parentRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      virtualizer.measure();
    }
  }, []);

  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div className="flex flex-col h-full">
      {/* Bulk actions bar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {Object.keys(rowSelection).length} contact(s) selected
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => handleBulkLifecycleUpdate(e.target.value)}
              className="text-sm border-gray-300 rounded-md"
              defaultValue=""
            >
              <option value="" disabled>Update lifecycle stage...</option>
              <option value="lead">Lead</option>
              <option value="mql">MQL</option>
              <option value="sql">SQL</option>
              <option value="opportunity">Opportunity</option>
              <option value="customer">Customer</option>
              <option value="evangelist">Evangelist</option>
            </select>
            <button
              onClick={() => setRowSelection({})}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto" ref={parentRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ width: header.column.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {virtualRows.map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(currentPage - 1));
              router.push(`/crm/contacts?${params.toString()}`);
            }}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(currentPage + 1));
              router.push(`/crm/contacts?${params.toString()}`);
            }}
            disabled={!hasMore}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * 20 + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * 20, totalCount)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{totalCount}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(currentPage - 1));
                  router.push(`/crm/contacts?${params.toString()}`);
                }}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(currentPage + 1));
                  router.push(`/crm/contacts?${params.toString()}`);
                }}
                disabled={!hasMore}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}