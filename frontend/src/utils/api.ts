export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export function getServerUrl(): string {
  // 1. Check localStorage for user-configured custom server
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('novotion_server_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // 2. If running via browser on Firebase Hosting (web.app / firebaseapp.com), use same-origin proxy
    if (window.location.origin && (window.location.origin.includes('web.app') || window.location.origin.includes('firebaseapp.com'))) {
      return window.location.origin;
    }

    // 3. Check environment variable VITE_API_URL (must be accessible from client browser / Electron)
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl && envApiUrl.trim()) {
      return envApiUrl.trim().replace(/\/+$/, '');
    }

    // 4. If running via browser/HTTP, use current window origin
    if (window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost')) {
      return window.location.origin;
    }
  }

  // 5. Default fallback to production Cloud Function URL
  return 'https://asia-south1-novotionsalesandlead.cloudfunctions.net/api';
}

export function setServerUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const cleaned = url.trim().replace(/\/+$/, '');
    localStorage.setItem('novotion_server_url', cleaned);
  }
}

export async function checkServerHealth(url?: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const base = (url || getServerUrl()).replace(/\/+$/, '');
  const targetUrl = base.endsWith('/api') ? `${base}/health` : `${base}/api/health`;
  try {
    const res = await fetch(targetUrl, { method: 'GET', cache: 'no-cache' });
    if (res.ok) {
      return { ok: true, status: res.status };
    }
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Server unreachable' };
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('novotion_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prepend base URL if relative path
  let fullUrl = endpoint;
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    const base = getServerUrl().replace(/\/+$/, '');
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.substring(4);
    }
    fullUrl = `${base}${cleanEndpoint}`;
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMessage = data?.error || `Request failed with status ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export function exportToCSV(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) return;

  const resolvedHeaders = headers || Object.keys(rows[0]).map((key) => ({ key, label: key }));
  
  const headerRow = resolvedHeaders.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  
  const dataRows = rows.map((row) => {
    return resolvedHeaders.map((h) => {
      const val = row[h.key];
      if (val === null || val === undefined) return '""';
      const formatted = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
