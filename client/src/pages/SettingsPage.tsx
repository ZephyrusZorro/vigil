import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi, importExportApi, categoriesApi } from '@/api/client';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Settings,
  Bell,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Shield,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  // New Rule Form state
  const [ruleName, setRuleName] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [ruleDays, setRuleDays] = useState('30, 14, 7, 3, 1');
  const [ruleChannels, setRuleChannels] = useState<string[]>(['dashboard', 'email']);

  // Import state
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Fetch alert rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: alertsApi.getRules,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  // Save rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingRule?.id) {
        return alertsApi.updateRule(editingRule.id, payload);
      }
      return alertsApi.createRule(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success(editingRule?.id ? 'Rule updated' : 'Rule created');
      setIsRuleModalOpen(false);
      setEditingRule(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save rule');
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => alertsApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule removed');
      setDeleteRuleId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete rule');
    },
  });

  // Test alerts mutation
  const testAlertsMutation = useMutation({
    mutationFn: alertsApi.test,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['pending-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(res.message || 'Alert simulation completed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Alert simulation failed');
    },
  });

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      toast.error('Rule name is required');
      return;
    }

    const days = ruleDays
      .split(',')
      .map(d => parseInt(d.trim(), 10))
      .filter(d => !isNaN(d) && d >= 0);

    if (days.length === 0) {
      toast.error('At least one valid day threshold is required');
      return;
    }

    saveRuleMutation.mutate({
      name: ruleName.trim(),
      category_id: ruleCategoryId || null,
      days_before: days,
      channels: ruleChannels,
      is_active: true,
    });
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) {
      toast.error('Please paste JSON data to import');
      return;
    }

    try {
      const parsed = JSON.parse(importJson);
      const itemsToImport = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(itemsToImport)) {
        toast.error('Invalid format: Expected a JSON array of items');
        return;
      }

      setIsImporting(true);
      const res = await importExportApi.importItems(itemsToImport);
      toast.success(`Imported ${res.importedCount} items`);
      setImportJson('');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      toast.error('Invalid JSON syntax: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>Rules & System Configuration</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure proactive notification policies, manage data imports/exports, and inspect engine metrics
        </p>
      </div>

      {/* Section 1: Alert Rules */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Automated Alert Triggers</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Rules determine when notifications fire before an item expires or requires renewal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => testAlertsMutation.mutate()}
              disabled={testAlertsMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testAlertsMutation.isPending ? 'Testing...' : 'Run Alert Evaluation'}</span>
            </button>

            <button
              onClick={() => {
                setEditingRule(null);
                setRuleName('');
                setRuleCategoryId('');
                setRuleDays('30, 14, 7, 3, 1');
                setRuleChannels(['dashboard', 'email']);
                setIsRuleModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Rule</span>
            </button>
          </div>
        </div>

        {/* Rules Table */}
        <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-950/70 overflow-hidden text-xs">
          {rules.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">No alert rules configured.</div>
          ) : (
            rules.map((rule: any) => (
              <div
                key={rule.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100">{rule.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                      {rule.category_name || 'All Categories'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400 font-mono">
                    <span>Triggers:</span>
                    {rule.days_before.map((d: number) => (
                      <span
                        key={d}
                        className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-indigo-300"
                      >
                        {d}d
                      </span>
                    ))}
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-500 capitalize">
                      via {rule.channels.join(', ')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteRuleId(rule.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 2: Data Import & Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Records</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Download your complete registry for offline backups, audit compliance, or migration
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={importExportApi.exportUrl('csv')}
              download
              className="flex items-center justify-center gap-2 p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 transition group"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <span>Export CSV</span>
            </a>

            <a
              href={importExportApi.exportUrl('json')}
              download
              className="flex items-center justify-center gap-2 p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 transition group"
            >
              <FileCode className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
              <span>Export JSON</span>
            </a>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Batch JSON Import</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Import items from previous backups or external integrations
            </p>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-3">
            <textarea
              rows={3}
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder='[ { "name": "Item", "expiry_date": "2026-12-31" } ]'
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={isImporting || !importJson.trim()}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-semibold rounded-xl text-xs transition"
            >
              {isImporting ? 'Importing...' : 'Parse & Ingest Records'}
            </button>
          </form>
        </div>
      </div>

      {/* Section 3: Architecture & Security Overview */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>System Architecture & Data Sovereignty</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
          <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
            <span className="font-semibold text-zinc-200 block mb-1">Local-First Persistence</span>
            <p className="leading-relaxed">
              Powered by SQLite with Write-Ahead Logging (WAL) enabled. All records and uploaded documents reside strictly on your infrastructure.
            </p>
          </div>

          <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
            <span className="font-semibold text-zinc-200 block mb-1">Risk Weighting Engine</span>
            <p className="leading-relaxed">
              Dynamically scores items from 0-100 based on time to expiration, financial exposure, category criticality, and manual priority overrides.
            </p>
          </div>

          <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
            <span className="font-semibold text-zinc-200 block mb-1">Autonomous Verification</span>
            <p className="leading-relaxed">
              Automatic background hourly checks ensure items transition to expired states in real-time, preventing silent compliance drift.
            </p>
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Create Alert Rule"
        description="Set notification lead times for expiring agreements"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Rule Name</label>
            <input
              type="text"
              required
              value={ruleName}
              onChange={e => setRuleName(e.target.value)}
              placeholder="e.g. Critical 60-Day Renewal Window"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Target Category (Optional)</label>
            <select
              value={ruleCategoryId}
              onChange={e => setRuleCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Apply to All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              Trigger Days Before Expiry (comma-separated)
            </label>
            <input
              type="text"
              required
              value={ruleDays}
              onChange={e => setRuleDays(e.target.value)}
              placeholder="90, 60, 30, 14, 7, 3, 1"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
              className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveRuleMutation.isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition"
            >
              {saveRuleMutation.isPending ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Rule Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteRuleId)}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={() => deleteRuleId && deleteRuleMutation.mutate(deleteRuleId)}
        title="Delete Alert Rule"
        message="Are you sure you want to remove this alert rule? Items will no longer trigger notifications under this policy."
        isDestructive
        isLoading={deleteRuleMutation.isPending}
      />
    </div>
  );
};
