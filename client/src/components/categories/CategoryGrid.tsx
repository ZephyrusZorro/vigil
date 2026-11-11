import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/api/client';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, ArrowRight, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryGridProps {
  categories: any[];
  onEdit: (category: any) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onEdit }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Category deleted');
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete category');
    },
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat: any) => (
          <div
            key={cat.id}
            className="group relative bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between"
          >
            <div>
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/10 shadow-sm"
                    style={{ backgroundColor: `${cat.color || '#6366F1'}20` }}
                  >
                    <span>{cat.icon || '📁'}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-sm group-hover:text-indigo-400 transition">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] text-zinc-500 capitalize">
                      Default risk: {cat.default_risk_level || 'medium'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEdit(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(cat.id);
                      setDeleteName(cat.name);
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              )}
            </div>

            {/* Counts & Action */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-400 font-mono">
                <span className="font-semibold text-zinc-200">{cat.item_count || 0}</span>
                <span>items</span>
                {cat.active_count !== undefined && (
                  <span className="text-[10px] text-zinc-500">
                    ({cat.active_count} active)
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate(`/items?category=${cat.id}`)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                <span>View Items</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteName}"? Items in this category will become Uncategorized.`}
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
