/**
 * API utility for making requests to the StorePulse backend
 */

const LOCAL_PRIMARY = 'http://localhost:9005';
const LOCAL_SECONDARY = 'http://127.0.0.1:9005';

let PRIMARY_BASE = '';
let FALLBACK_BASE = LOCAL_PRIMARY;

function normalizeBase(base: string | undefined | null): string {
  if (!base) return '';
  let trimmed = String(base).trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    // If scheme missing, assume http to avoid "expected pattern" URL errors
    trimmed = `http://${trimmed}`;
  }
  // Remove trailing slash for predictable joining
  return trimmed.replace(/\/+$/, '');
}

const ENV_BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL)
  : '';

if (ENV_BASE) {
  const normalized = normalizeBase(ENV_BASE);
  PRIMARY_BASE = normalized;
  FALLBACK_BASE = normalized || FALLBACK_BASE;
}

if (typeof window !== 'undefined') {
  const globalWindow = window as typeof window & {
    __STOREPULSE_API__?: string;
    __TAURI__?: unknown;
  };

  // Check if we're in a production web environment (not Tauri, not localhost)
  const isProductionWeb = 
    !globalWindow.__TAURI__ && 
    globalWindow.location?.protocol !== 'file:' &&
    !globalWindow.location?.hostname?.includes('localhost') &&
    !globalWindow.location?.hostname?.includes('127.0.0.1');

  if (globalWindow.__STOREPULSE_API__) {
    PRIMARY_BASE = normalizeBase(globalWindow.__STOREPULSE_API__ as string);
    FALLBACK_BASE = PRIMARY_BASE || LOCAL_SECONDARY;
  } else if (globalWindow.__TAURI__ || globalWindow.location?.protocol === 'file:') {
    // Tauri desktop app - use localhost
    PRIMARY_BASE = LOCAL_PRIMARY;
    FALLBACK_BASE = LOCAL_SECONDARY;
  } else if (isProductionWeb && ENV_BASE) {
    // Production web - use environment variable if set
    PRIMARY_BASE = normalizeBase(ENV_BASE);
    FALLBACK_BASE = PRIMARY_BASE;
  } else if (isProductionWeb && !ENV_BASE) {
    // Production web but no env var - use relative URLs (same origin)
    PRIMARY_BASE = '';
    FALLBACK_BASE = '';
  } else {
    // Development mode - use localhost
    PRIMARY_BASE = LOCAL_PRIMARY;
    FALLBACK_BASE = LOCAL_SECONDARY;
  }
}

// Ensure PRIMARY_BASE always has a valid default to prevent URL pattern errors
if (!PRIMARY_BASE || PRIMARY_BASE.trim() === '') {
  PRIMARY_BASE = LOCAL_PRIMARY;
}

function withBase(endpoint: string, base: string) {
  // Ensure we always have a single slash between base and endpoint
  if (!base || base.trim() === '') {
    // If no base provided, return endpoint as-is (assumes relative URL or absolute endpoint)
    return endpoint;
  }
  // Always add a slash between base and endpoint
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
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
  const bases = [PRIMARY_BASE, FALLBACK_BASE, LOCAL_PRIMARY]
    .filter((b) => b && b.trim().length > 0)
    .map((b, idx, arr) => {
      // Ensure uniqueness while preserving order
      if (arr.indexOf(b) !== idx) return '';
      return b;
    })
    .filter(Boolean);

  // Ensure we have at least one base URL
  if (bases.length === 0) {
    bases.push(LOCAL_PRIMARY);
  }

  let lastHttpError: ApiError | null = null;
  let lastNetworkError: Error | null = null;
  const attemptedUrls: string[] = [];

  for (const base of bases) {
    const url = isAbsolute ? endpoint : withBase(endpoint, base);
    attemptedUrls.push(url);

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
      // Normalize URL/DOM parsing errors into a friendly message
      let message = 'Network error';
      if (error instanceof Error) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (errorMsg.includes('pattern') || errorMsg.includes('invalid url')) {
          message = `Invalid API URL format. Tried: ${attemptedUrls.join(', ')}. Please ensure backend is running on port 9005.`;
        } else if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror')) {
          message = `Cannot connect to backend API. Tried: ${attemptedUrls.join(', ')}. Please ensure the backend is running on port 9005.`;
        } else {
          message = error.message;
        }
      }
      lastNetworkError = new Error(message);
      continue;
    }
  }

  if (lastHttpError) {
    throw lastHttpError;
  }

  const errorMessage = lastNetworkError?.message 
    ?? `Cannot connect to backend API. Tried: ${attemptedUrls.join(', ')}. Please ensure the backend is running on port 9005.`;
  
  throw {
    message: errorMessage,
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
  // EventSource requires absolute URLs, so always use a valid base
  const base = PRIMARY_BASE || FALLBACK_BASE || LOCAL_PRIMARY;
  const url = withBase(endpoint, base);
  
  // Validate URL is absolute to prevent pattern errors
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`Invalid EventSource URL: ${url}. EventSource requires an absolute URL starting with http:// or https://`);
  }
  
  return new EventSource(url);
}

/**
 * Get the current API base URL
 */
export function getApiBaseUrl(): string {
  return PRIMARY_BASE || FALLBACK_BASE || LOCAL_PRIMARY;
}

/**
 * Format numbers using Indian numbering system (e.g., 1,37,000 instead of 137,000)
 */
export function formatIndianNumber(num: number): string {
  return num.toLocaleString('en-IN');
}
