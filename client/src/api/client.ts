const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    throw new ApiError(response.status, errorData.error || 'An unexpected error occurred', errorData);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

// ── Item API ──
export const itemsApi = {
  list: async (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && val !== 'all') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString();
    const url = `/items${qStr ? `?${qStr}` : ''}`;
    
    // We want both data and pagination
    const res = await fetch(`${API_BASE}${url}`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  get: (id: string) => request<any>(`/items/${id}`),

  create: (data: any) =>
    request<any>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/items/${id}`, {
      method: 'DELETE',
    }),

  updateStatus: (id: string, status: string) =>
    request<any>(`/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  bulkDelete: (ids: string[]) =>
    request<any>('/items/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkUpdateStatus: (ids: string[], status: string) =>
    request<any>('/items/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),

  renew: (id: string) =>
    request<any>(`/items/${id}/renew`, {
      method: 'POST',
    }),

  snooze: (id: string, days: number = 7) =>
    request<any>(`/items/${id}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    }),

  timeline: () => request<any[]>('/items/timeline'),
};

// ── Dashboard API ──
export const dashboardApi = {
  get: () => request<any>('/dashboard'),
};

// ── Categories API ──
export const categoriesApi = {
  list: () => request<any[]>('/categories'),
  get: (id: string) => request<any>(`/categories/${id}`),
  create: (data: any) =>
    request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<any>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// ── Documents API ──
export const documentsApi = {
  upload: async (itemId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>(`/documents/upload/${itemId}`, {
      method: 'POST',
      body: formData,
    });
  },
  downloadUrl: (id: string) => `${API_BASE}/documents/download/${id}`,
  delete: (id: string) =>
    request<any>(`/documents/${id}`, {
      method: 'DELETE',
    }),
};

// ── Alerts API ──
export const alertsApi = {
  getRules: () => request<any[]>('/alerts/rules'),
  createRule: (data: any) =>
    request<any>('/alerts/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRule: (id: string, data: any) =>
    request<any>(`/alerts/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRule: (id: string) =>
    request<any>(`/alerts/rules/${id}`, {
      method: 'DELETE',
    }),
  getPending: () => request<any[]>('/alerts/pending'),
  dismiss: (id: string) =>
    request<any>(`/alerts/dismiss/${id}`, {
      method: 'POST',
    }),
  test: () =>
    request<any>('/alerts/test', {
      method: 'POST',
    }),
};

// ── Activity API ──
export const activityApi = {
  list: async (page = 1, limit = 20) => {
    const res = await fetch(`${API_BASE}/activity?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },
};

// ── Tags API ──
export const tagsApi = {
  list: () => request<any[]>('/tags'),
  create: (data: { name: string; color?: string }) =>
    request<any>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<any>(`/tags/${id}`, {
      method: 'DELETE',
    }),
};

// ── Search API ──
export const searchApi = {
  query: (q: string) => request<any[]>(`/search?q=${encodeURIComponent(q)}`),
};

// ── Import/Export API ──
export const importExportApi = {
  exportUrl: (format: 'json' | 'csv' = 'json') => `${API_BASE}/import-export/export?format=${format}`,
  importItems: (items: any[]) =>
    request<any>('/import-export/import', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};
