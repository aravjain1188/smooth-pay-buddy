// App configuration with proper URL handling
// HARDCODED production URL to ensure reset password emails work correctly
const PRODUCTION_URL = "https://smooth-pay-buddy.vercel.app";

export const getAppUrl = (): string => {
  const origin = window.location.origin;
  
  // If we're on localhost or 127.0.0.1, use that (for development)
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }
  
  // If we're on vercel.app or vercel.dev, use that (for preview/production)
  if (origin.includes('vercel.app') || origin.includes('vercel.dev')) {
    return origin;
  }
  
  // Otherwise (including Lovable preview), use the hardcoded production URL
  return PRODUCTION_URL;
};

export const getResetPasswordUrl = (): string => {
  return `${PRODUCTION_URL}/reset-password`;
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
