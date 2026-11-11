import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, documentsApi } from '@/api/client';
import { DaysLeftPill } from '../ui/DaysLeftPill';
import { RiskBadge } from '../ui/RiskBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { CategoryBadge } from '../ui/CategoryBadge';
import { FileUpload } from '../ui/FileUpload';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { formatDate } from '@/utils/dates';
import { formatCurrency, formatFileSize } from '@/utils/format';
import {
  Calendar,
  Building,
  User,
  Mail,
  DollarSign,
  Tag,
  FileText,
  Download,
  Trash2,
  Edit,
  ExternalLink,
  Clock,
  ShieldCheck,
  RefreshCw,
  BellOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ItemDetailProps {
  itemId: string;
  onClose: () => void;
  onEdit: (item: any) => void;
  onDeleted?: () => void;
}

export const ItemDetail: React.FC<ItemDetailProps> = ({
  itemId,
  onClose,
  onEdit,
  onDeleted,
}) => {
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.get(itemId),
    enabled: Boolean(itemId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Item deleted successfully');
      setIsDeleteOpen(false);
      onClose();
      onDeleted?.();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete item');
    },
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => itemsApi.updateStatus(itemId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Status updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update status');
    },
  });

  // Document upload mutation
  const uploadDocMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(itemId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      toast.success('Document uploaded');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload document');
    },
  });

  // Document delete mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => documentsApi.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      toast.success('Document deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete document');
    },
  });

  // One-click renew mutation
  const renewMutation = useMutation({
    mutationFn: () => itemsApi.renew(itemId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-alerts'] });
      toast.success(res.message || 'Item successfully renewed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Renewal failed');
    },
  });

  // Snooze mutation
  const snoozeMutation = useMutation({
    mutationFn: (days: number) => itemsApi.snooze(itemId, days),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(res.message || 'Item snoozed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Snooze failed');
    },
  });

  if (isLoading || !item) {
    return (
      <div className="py-12 flex justify-center text-zinc-500 text-xs">
        Loading details...
      </div>
    );
  }

  const documents = item.documents || [];

  return (
    <div className="space-y-6 text-xs text-zinc-300">
      {/* Top Header / Actions */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CategoryBadge
              name={item.category_name || 'Uncategorized'}
              color={item.category_color}
            />
            <StatusBadge status={item.status} size="sm" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">{item.name}</h2>
          {item.description && (
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
            title="Edit item"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/20"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Critical Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl">
        <div>
          <div className="text-[11px] text-zinc-500 font-medium">Time Remaining</div>
          <div className="mt-1">
            <DaysLeftPill days={item.days_until_expiry} />
          </div>
        </div>

        <div>
          <div className="text-[11px] text-zinc-500 font-medium">Risk Score</div>
          <div className="mt-1">
            <RiskBadge level={item.risk_level} score={item.risk_score} showScore />
          </div>
        </div>

        <div>
          <div className="text-[11px] text-zinc-500 font-medium">Cost Exposure</div>
          <div className="mt-1 font-semibold text-zinc-100">
            {formatCurrency(item.cost, item.currency)}
            {item.recurrence && item.recurrence !== 'none' && (
              <span className="text-[10px] text-zinc-500 font-normal ml-1">
                /{item.recurrence.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-zinc-500 font-medium">Status Action</div>
          <div className="mt-1">
            <select
              value={item.status}
              onChange={e => statusMutation.mutate(e.target.value)}
              disabled={statusMutation.isPending}
              className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="snoozed">Snoozed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Action Ribbon */}
      <div className="flex items-center gap-2.5 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs">
        <button
          onClick={() => renewMutation.mutate()}
          disabled={renewMutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm shadow-indigo-900/40 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${renewMutation.isPending ? 'animate-spin' : ''}`} />
          <span>{renewMutation.isPending ? 'Advancing Cycle...' : 'Quick Renew (+1 Cycle)'}</span>
        </button>

        <button
          onClick={() => snoozeMutation.mutate(7)}
          disabled={snoozeMutation.isPending}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg border border-zinc-700 transition disabled:opacity-50"
          title="Snooze alerts for 7 days"
        >
          <BellOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Snooze (7d)</span>
        </button>
      </div>

      {/* Metadata Detail Sections */}
      <div className="space-y-4">
        {/* Timeline Details */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
          <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Timeline & Dates</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <span className="text-zinc-500 block">Start Date</span>
              <span className="font-mono text-zinc-300">{formatDate(item.start_date)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Expiry Date</span>
              <span className="font-mono font-semibold text-zinc-100">{formatDate(item.expiry_date)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Target Renewal</span>
              <span className="font-mono text-zinc-300">{formatDate(item.renewal_date)}</span>
            </div>
          </div>
        </div>

        {/* Responsible Person & Vendor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-zinc-500 text-[11px] flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Responsible Person</span>
            </span>
            <p className="font-semibold text-zinc-200 pt-1">
              {item.responsible_person || 'Unassigned'}
            </p>
            {item.responsible_email && (
              <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{item.responsible_email}</span>
              </p>
            )}
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-zinc-500 text-[11px] flex items-center gap-1.5 font-medium">
              <Building className="w-3.5 h-3.5 text-zinc-400" />
              <span>Vendor / Provider</span>
            </span>
            <p className="font-semibold text-zinc-200 pt-1">
              {item.vendor || 'No vendor specified'}
            </p>
            {item.vendor_contact && (
              <p className="text-[11px] text-zinc-500">{item.vendor_contact}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div>
            <div className="text-zinc-500 text-[11px] font-medium mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t: string) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700/60"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-zinc-500 text-[11px] font-medium">Internal Notes</span>
            <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
              {item.notes}
            </p>
          </div>
        )}

        {/* Attached Documents */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Attached Documents ({documents.length})</span>
            </h4>
          </div>

          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-lg hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="font-medium text-zinc-200 truncate">
                      {doc.original_name}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex-shrink-0 font-mono">
                      ({formatFileSize(doc.size_bytes)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={documentsApi.downloadUrl(doc.id)}
                      download
                      className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800 rounded transition"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => deleteDocMutation.mutate(doc.id)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded transition"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload new file */}
          <div className="pt-2">
            <FileUpload
              onFileSelect={file => uploadDocMutation.mutate(file)}
              isLoading={uploadDocMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Item"
        message={`Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`}
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
