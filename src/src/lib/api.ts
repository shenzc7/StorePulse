/**
 * API utility for making requests to the StorePulse backend
 */

const LOCAL_PRIMARY = 'http://127.0.0.1:9000';
const LOCAL_SECONDARY = 'http://localhost:9000';

let PRIMARY_BASE = '';
let FALLBACK_BASE = LOCAL_PRIMARY;

const ENV_BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL)
  : '';

if (ENV_BASE) {
  PRIMARY_BASE = ENV_BASE;
  FALLBACK_BASE = ENV_BASE;
}

if (typeof window !== 'undefined') {
  const globalWindow = window as typeof window & {
    __STOREPULSE_API__?: string;
    __TAURI__?: unknown;
  };

  if (globalWindow.__STOREPULSE_API__) {
    PRIMARY_BASE = globalWindow.__STOREPULSE_API__ as string;
    FALLBACK_BASE = LOCAL_SECONDARY;
  } else if (globalWindow.__TAURI__ || globalWindow.location?.protocol === 'file:') {
    PRIMARY_BASE = LOCAL_PRIMARY;
    FALLBACK_BASE = LOCAL_SECONDARY;
  } else {
    PRIMARY_BASE = '';
    FALLBACK_BASE = LOCAL_PRIMARY;
  }
}

function withBase(endpoint: string, base: string) {
  // "Return the JSX structure for this component."
  return `${base}${endpoint}`;
}

type FetchConfig = {
  endpoint: string;
  init?: RequestInit;
};

async function safeParseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}

async function requestWithFallback<T>({ endpoint, init }: FetchConfig): Promise<T> {
  const isAbsolute = /^https?:\/\//i.test(endpoint);
  const bases = [PRIMARY_BASE];

  if (FALLBACK_BASE && FALLBACK_BASE !== PRIMARY_BASE) {
    bases.push(FALLBACK_BASE);
  }

  let lastHttpError: ApiError | null = null;
  let lastNetworkError: Error | null = null;

  for (const base of bases) {
    const url = isAbsolute ? endpoint : withBase(endpoint, base);

    try {
      const response = await fetch(url, init);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        lastHttpError = {
          message: errorText || `Request failed with status ${response.status}`,
          status: response.status,
        };
        continue;
      }

      if (base && base !== PRIMARY_BASE) {
        PRIMARY_BASE = base;
      }

      return await safeParseJson<T>(response);
    } catch (error) {
      lastNetworkError = error instanceof Error ? error : new Error('Network error');
      continue;
    }
  }

  if (lastHttpError) {
    throw lastHttpError;
  }

  throw {
    message: lastNetworkError?.message ?? 'Network error - ensure backend is running',
    status: 0,
  } as ApiError;
}

export interface ApiError {
  // "Define the message field for this interface."
  message: string;
  // "Define the status field for this interface."
  status?: number;
}

/**
 * Make a GET request to the API
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return requestWithFallback<T>({ endpoint });
}

/**
 * Make a POST request to the API
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options?.headers,
  };

  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  const init: RequestInit = {
    method: 'POST',
    headers,
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
  };

  return requestWithFallback<T>({ endpoint, init });
}

/**
 * Make a PUT request to the API
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const init: RequestInit = {
    method: 'PUT',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  return requestWithFallback<T>({ endpoint, init });
}

/**
 * Upload a file to the API
 */
export async function apiUpload<T>(
  // "Set the endpoint property for this object literal."
  endpoint: string,
  // "Set the file property for this object literal."
  file: File,
  // "Execute this line as part of the component logic."
  additionalData?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  return requestWithFallback<T>({
    endpoint,
    init: {
      method: 'POST',
      body: formData,
    },
  });
}

/**
 * Make a DELETE request to the API
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return requestWithFallback<T>({
    endpoint,
    init: { method: 'DELETE' },
  });
}

/**
 * Create an EventSource for Server-Sent Events
 */
export function createEventSource(endpoint: string): EventSource {
  // EventSource does not easily support runtime fallback; use PRIMARY_BASE.
  const base = PRIMARY_BASE || FALLBACK_BASE || '';
  const url = withBase(endpoint, base);
  // "Return the JSX structure for this component."
  return new EventSource(url);
}

/**
 * Format numbers using Indian numbering system (e.g., 1,37,000 instead of 137,000)
 */
export function formatIndianNumber(num: number): string {
  return num.toLocaleString('en-IN');
}
