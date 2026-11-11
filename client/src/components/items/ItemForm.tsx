import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, categoriesApi } from '@/api/client';
import { RiskLevel, ItemStatus } from '@/types';
import toast from 'react-hot-toast';

interface ItemFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [status, setStatus] = useState<ItemStatus>(initialData?.status || 'active');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiry_date || '');
  const [renewalDate, setRenewalDate] = useState(initialData?.renewal_date || '');
  const [cost, setCost] = useState(initialData?.cost !== undefined && initialData?.cost !== null ? String(initialData.cost) : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [recurrence, setRecurrence] = useState(initialData?.recurrence || 'none');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(initialData?.risk_level || 'medium');
  const [responsiblePerson, setResponsiblePerson] = useState(initialData?.responsible_person || '');
  const [responsibleEmail, setResponsibleEmail] = useState(initialData?.responsible_email || '');
  const [vendor, setVendor] = useState(initialData?.vendor || '');
  const [vendorContact, setVendorContact] = useState(initialData?.vendor_contact || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [tagsInput, setTagsInput] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : ''
  );

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (initialData?.id) {
        return itemsApi.update(initialData.id, payload);
      }
      return itemsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-alerts'] });
      toast.success(initialData?.id ? 'Item updated successfully' : 'Item created successfully');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save item');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!expiryDate) {
      toast.error('Expiry date is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t: string) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      status,
      start_date: startDate || null,
      expiry_date: expiryDate,
      renewal_date: renewalDate || null,
      cost: cost ? parseFloat(cost) : null,
      currency,
      recurrence,
      risk_level: riskLevel,
      responsible_person: responsiblePerson.trim() || null,
      responsible_email: responsibleEmail.trim() || null,
      vendor: vendor.trim() || null,
      vendor_contact: vendorContact.trim() || null,
      notes: notes.trim() || null,
      tags: tags.length > 0 ? tags : null,
    };

    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      {/* Basic Info */}
      <div className="space-y-3">
        <div>
          <label className="block font-medium text-zinc-300 mb-1">
            Item Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. AWS Enterprise Support, Texas Master Electrician License"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select a category...</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ItemStatus)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="snoozed">Snoozed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-300 mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Key terms, SLA requirements, coverage specifics..."
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Dates & Timeline */}
      <div className="pt-3 border-t border-zinc-800/80">
        <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2.5">
          Dates & Deadlines
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">
              Expiry Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Target Renewal Date</label>
            <input
              type="date"
              value={renewalDate}
              onChange={e => setRenewalDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="pt-3 border-t border-zinc-800/80">
        <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2.5">
          Cost & Recurrence
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-400 mb-1">Cost</label>
            <input
              type="number"
              step="any"
              min="0"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Recurrence Cycle</label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">One-time / None</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi_annual">Semi-Annual</option>
              <option value="annual">Annual</option>
              <option value="biennial">Biennial (2 Years)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk Level Selector */}
      <div className="pt-3 border-t border-zinc-800/80">
        <label className="block font-medium text-zinc-300 mb-1.5">
          Priority / Risk Level
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map(level => {
            const isSelected = riskLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setRiskLevel(level)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition ${
                  isSelected
                    ? level === 'critical'
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : level === 'high'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                      : level === 'medium'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsible & Vendor */}
      <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-zinc-400 mb-1">Owner / Responsible Person</label>
          <input
            type="text"
            value={responsiblePerson}
            onChange={e => setResponsiblePerson(e.target.value)}
            placeholder="e.g. Sarah Chen"
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-1">Owner Email</label>
          <input
            type="email"
            value={responsibleEmail}
            onChange={e => setResponsibleEmail(e.target.value)}
            placeholder="sarah.chen@example.com"
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-1">Vendor / Issuer</label>
          <input
            type="text"
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            placeholder="e.g. Travelers Insurance, AWS"
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-1">Vendor Contact / Support</label>
          <input
            type="text"
            value={vendorContact}
            onChange={e => setVendorContact(e.target.value)}
            placeholder="support@vendor.com"
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tags & Notes */}
      <div className="pt-3 border-t border-zinc-800/80 space-y-3">
        <div>
          <label className="block text-zinc-400 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="urgent, mission-critical, auto-renew"
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-1">Internal Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Renewal caveats, negotiation notes, account IDs..."
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
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
          {mutation.isPending ? 'Saving...' : initialData?.id ? 'Update Record' : 'Create Record'}
        </button>
      </div>
    </form>
  );
};
