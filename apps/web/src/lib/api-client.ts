export const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiFetchOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

export async function apiFetch(input: RequestInfo | URL, init?: ApiFetchOptions): Promise<any> {
  const mergedInit: RequestInit = {
    ...init,
    credentials: init?.credentials || 'include',
  };
  
  let res: Response;
  try {
    res = await fetch(input, mergedInit);
  } catch (err: any) {
    throw new Error(err.message || 'Network error occurred. Please check your connection.');
  }
  
  if (res.status === 401 && !init?.skipAuthRedirect) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/admin/login') {
        document.cookie = 'auth_token=; Max-Age=0; path=/;';
        window.location.href = '/admin/login';
      }
    }
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  let data: any = null;
  let textData: string = '';
  
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      // Ignore JSON parse errors if it claims to be JSON but isn't
    }
  } else {
    textData = await res.text();
  }
  
  if (!res.ok) {
    let errorMessage = '';
    
    // 1. Try to extract business validation message from JSON
    if (data && data.message) {
      errorMessage = data.message;
    } else if (data && data.error) {
      errorMessage = data.error;
    } 
    // 2. Try to use plain text if it's meaningful and not HTML
    else if (!isJson && textData && !textData.startsWith('<')) {
      errorMessage = textData;
    } 
    // 3. Fallback to generic messages
    else {
      switch (res.status) {
        case 401: errorMessage = 'Session expired. Please sign in again.'; break;
        case 403: errorMessage = "You don't have permission to perform this action."; break;
        case 404: errorMessage = 'Requested data could not be found.'; break;
        case 409: errorMessage = 'This item is currently being used and cannot be deleted.'; break;
        case 429: errorMessage = 'Too many requests. Please wait a moment and try again.'; break;
        case 500: errorMessage = 'Something went wrong. Please try again later.'; break;
        default: errorMessage = `An error occurred (${res.status}).`; break;
      }
    }
    throw new Error(errorMessage);
  }
  
  if (isJson) {
    // If wrapped in standard success envelope, unwrap it
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === true) {
        return data.data;
      } else {
        throw new Error(data.message || 'An error occurred.');
      }
    }
    return data;
  }
  
  return textData;
}
