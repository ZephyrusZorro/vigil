import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { itemsApi } from '@/api/client';
import { FilterBar } from '@/components/items/FilterBar';
import { ItemsTable } from '@/components/items/ItemsTable';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemDetail } from '@/components/items/ItemDetail';
import { ItemForm } from '@/components/items/ItemForm';
import { SlideOver } from '@/components/ui/SlideOver';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { Layers, Plus, Trash2, CheckCircle, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

export const ItemsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const initialItemId = searchParams.get('id');
  const initialCategory = searchParams.get('category') || '';

  // Local state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [sortField, setSortField] = useState('expiry_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selected items for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialItemId);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    }
    if (initialCategory) {
      setCategoryId(initialCategory);
    }
  }, [initialItemId, initialCategory]);

  // Fetch items
  const { data, isLoading } = useQuery({
    queryKey: [
      'items',
      { search: debouncedSearch, categoryId, status, riskLevel, page, pageSize, sortField, sortOrder },
    ],
    queryFn: () =>
      itemsApi.list({
        search: debouncedSearch,
        category: categoryId,
        status,
        risk_level: riskLevel,
        page,
        limit: pageSize,
        sort: sortField,
        order: sortOrder,
      }),
  });

  const items = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => itemsApi.bulkDelete(ids),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Deleted ${res.data?.deleted || selectedIds.length} items`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk delete failed');
    },
  });

  // Bulk status mutation
  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      itemsApi.bulkUpdateStatus(ids, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Updated ${selectedIds.length} items to ${variables.status}`);
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk status update failed');
    },
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('');
    setRiskLevel('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Master Item Registry</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Central repository of all tracked licenses, contracts, certifications, and renewable assets
          </p>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-indigo-500/40 rounded-xl shadow-lg animate-fadeIn text-xs">
            <span className="px-2 font-semibold text-indigo-300">
              {selectedIds.length} selected
            </span>

            <button
              onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'archived' })}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={val => {
          setSearch(val);
          setPage(1);
        }}
        categoryId={categoryId}
        onCategoryChange={val => {
          setCategoryId(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={val => {
          setStatus(val);
          setPage(1);
        }}
        riskLevel={riskLevel}
        onRiskLevelChange={val => {
          setRiskLevel(val);
          setPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onReset={handleResetFilters}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Fetching registry records..." />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No tracked items match your criteria"
          description="Try clearing or adjusting your search filters, or register a new tracked item."
          action={{
            label: 'Clear Filters',
            onClick: handleResetFilters,
          }}
        />
      ) : viewMode === 'table' ? (
        <div className="space-y-3">
          <ItemsTable
            items={items}
            selectedIds={selectedIds}
            onToggleSelect={id => {
              setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              );
            }}
            onSelectAll={all => {
              setSelectedIds(all ? items.map((i: any) => i.id) : []);
            }}
            onItemClick={item => setSelectedItemId(item.id)}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItemId(item.id)}
                selected={selectedIds.includes(item.id)}
                onSelect={sel => {
                  setSelectedIds(prev =>
                    sel ? [...prev, item.id] : prev.filter(i => i !== item.id)
                  );
                }}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Item Detail Slide-Over */}
      <SlideOver
        isOpen={Boolean(selectedItemId)}
        onClose={() => {
          setSelectedItemId(null);
          setSearchParams({});
        }}
        title="Record Overview"
        subtitle="Tracking metadata, risk factors & attachments"
        width="xl"
      >
        {selectedItemId && (
          <ItemDetail
            itemId={selectedItemId}
            onClose={() => {
              setSelectedItemId(null);
              setSearchParams({});
            }}
            onEdit={item => {
              setEditingItem(item);
              setSelectedItemId(null);
            }}
          />
        )}
      </SlideOver>

      {/* Edit Item Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit Record"
        description="Update tracked deadlines, terms, and metadata"
        maxWidth="2xl"
      >
        {editingItem && (
          <ItemForm
            initialData={editingItem}
            onSuccess={() => setEditingItem(null)}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(selectedIds)}
        title="Bulk Delete Items"
        message={`Are you sure you want to delete ${selectedIds.length} selected items? This action cannot be undone.`}
        isDestructive
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
};
