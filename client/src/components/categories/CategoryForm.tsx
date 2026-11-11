import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/api/client';
import { RiskLevel } from '@/types';
import toast from 'react-hot-toast';

interface CategoryFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState(initialData?.name || '');
  const [icon, setIcon] = useState(initialData?.icon || '📁');
  const [color, setColor] = useState(initialData?.color || '#6366F1');
  const [description, setDescription] = useState(initialData?.description || '');
  const [defaultRiskLevel, setDefaultRiskLevel] = useState<RiskLevel>(
    initialData?.default_risk_level || 'medium'
  );

  const colors = [
    '#4F46E5', '#059669', '#D97706', '#7C3AED',
    '#2563EB', '#EC4899', '#14B8A6', '#F97316',
    '#DC2626', '#64748B',
  ];

  const icons = ['📋', '🛡️', '🤝', '🎓', '🌐', '☁️', '🏢', '🚛', '⚖️', '📜', '🔒', '💻'];

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (initialData?.id) {
        return categoriesApi.update(initialData.id, payload);
      }
      return categoriesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(initialData?.id ? 'Category updated' : 'Category created');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    mutation.mutate({
      name: name.trim(),
      icon,
      color,
      description: description.trim() || null,
      default_risk_level: defaultRiskLevel,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="block font-medium text-zinc-300 mb-1">
          Category Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Environmental Permits, Hardware Leases"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Icon Selector */}
      <div>
        <label className="block font-medium text-zinc-300 mb-1.5">Icon</label>
        <div className="flex flex-wrap gap-2">
          {icons.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition ${
                icon === ic
                  ? 'border-indigo-500 bg-indigo-500/20'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selector */}
      <div>
        <label className="block font-medium text-zinc-300 mb-1.5">Accent Color</label>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition ${
                color === c ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block font-medium text-zinc-300 mb-1">Default Risk Level</label>
        <select
          value={defaultRiskLevel}
          onChange={e => setDefaultRiskLevel(e.target.value as RiskLevel)}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <label className="block font-medium text-zinc-300 mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What types of agreements or items belong here?"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md shadow-indigo-600/30 transition"
        >
          {mutation.isPending ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};
