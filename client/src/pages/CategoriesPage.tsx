import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/client';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FolderKanban, Plus } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            <span>Category Taxonomy</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Organize licenses, policies, certifications, and compliance sectors with custom risk defaults
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Loading category hierarchy..." />
        </div>
      ) : (
        <CategoryGrid
          categories={categories}
          onEdit={cat => {
            setEditingCategory(cat);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* Category Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        description="Configure taxonomy classification, icon badge, and default risk scoring"
        maxWidth="md"
      >
        <CategoryForm
          initialData={editingCategory}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingCategory(null);
          }}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCategory(null);
          }}
        />
      </Modal>
    </div>
  );
};
