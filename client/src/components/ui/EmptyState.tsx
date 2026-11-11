import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FileQuestion,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40">
      <div className="w-12 h-12 rounded-xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition shadow-sm shadow-indigo-900/30"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
