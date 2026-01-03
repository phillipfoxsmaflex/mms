import { apiUrl } from '../config';

type Options = RequestInit & { raw?: boolean; headers?: HeadersInit };
function api<T>(url: string, options: Options = {}): Promise<T> {
  // Check if body is FormData to avoid setting Content-Type
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData ? authHeader(false, true) : authHeader(false);
  
  // Merge headers properly: options.headers should override defaultHeaders
  const headers = { ...defaultHeaders, ...(options.headers || {}) };
  
  return fetch(url, { ...options, headers }).then(
    async (response) => {
      if (!response.ok) {
        throw new Error(JSON.stringify(await response.json()));
      }
      if (options?.raw) return response as unknown as Promise<T>;
      return response.json() as Promise<T>;
    }
  );
}

function get<T>(url, options?: Options) {
  return api<T>(apiUrl + url, options);
}

function post<T>(url, data, options?: Options, isNotJson?: boolean) {
  console.log('[API POST DEBUG] Calling:', apiUrl + url, 'with data:', data);
  // If data is FormData, pass it as-is
  const body = data instanceof FormData ? data : (isNotJson ? data : JSON.stringify(data));
  const result = api<T>(apiUrl + url, {
    ...options,
    method: 'POST',
    body
  });
  result.then(responseData => {
    console.log('[API POST DEBUG] Success response for', url, ':', responseData);
  }).catch(error => {
    console.error('[API POST DEBUG] Error response for', url, ':', error);
  });
  return result;
}

function patch<T>(url, data, options?: Options) {
  return api<T>(apiUrl + url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

function deletes<T>(url, options?: Options) {
  return api<T>(apiUrl + url, { ...options, method: 'DELETE' });
}

export function authHeader(publicRoute: boolean, skipContentType: boolean = false): HeadersInit {
  // return authorization header with jwt token
  let accessToken = localStorage.getItem('accessToken');

  if (!publicRoute && accessToken) {
    const headers: HeadersInit = {
      Authorization: 'Bearer ' + accessToken,
      Accept: 'application/json'
    };
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  } else {
    const headers: HeadersInit = {
      Accept: 'application/json'
    };
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }
}

export default { get, patch, post, deletes };
