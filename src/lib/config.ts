// App configuration with proper URL handling
export const getAppUrl = (): string => {
  // In production, use the environment variable
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  
  // In development/preview, use window.location.origin
  // but ensure it's not the Lovable preview URL
  const origin = window.location.origin;
  
  // If it's a Lovable preview URL, use localhost as fallback
  if (origin.includes('lovable') || origin.includes('replit')) {
    return 'http://localhost:5173';
  }
  
  return origin;
};

export const getResetPasswordUrl = (): string => {
  const baseUrl = getAppUrl();
  return `${baseUrl}/reset-password`;
};

export const getAuthCallbackUrl = (): string => {
  const baseUrl = getAppUrl();
  return `${baseUrl}/auth`;
};

// Validate that we're not redirecting to preview URLs
export const isValidRedirectUrl = (url: string): boolean => {
  const validPatterns = [
    import.meta.env.VITE_APP_URL,
    'localhost',
    '127.0.0.1',
    'vercel.app',
    'vercel.dev'
  ];
  
  return validPatterns.some(pattern => url.includes(pattern));
};
