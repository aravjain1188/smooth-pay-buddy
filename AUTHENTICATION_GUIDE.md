# Authentication System Guide

## For Users

### Signing In
1. Go to the login page at `/auth`
2. Enter your email and password
3. Click "Sign in"
4. **Optional**: Check "Remember this device" to have your email pre-filled on next visit

### Forgot Password
1. Click "Forgot password?" link on the login page
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email for the reset link
5. Click the link in the email (it will direct you to the reset password page)
6. Enter your new password (at least 6 characters)
7. Confirm your password by re-entering it
8. Click "Update Password"
9. You'll be redirected to login automatically - use your new password to sign in

### Creating an Account
1. Go to `/auth` page
2. Click "New here? Create an account"
3. Enter your name (founder name)
4. Enter your email
5. Enter a password (at least 6 characters)
6. Click "Create account"
7. You may need to confirm your email (check your inbox)

### Remember This Device
- When checked on sign-in, your email is saved on this device
- Only your email is saved (not your password)
- You'll still need to enter your password each time
- Useful for laptops/desktops you use frequently
- Uncheck next time to remove the saved email

## For Developers

### Environment Configuration

Add these to your `.env` file (local) or Vercel environment variables (production):

```
VITE_APP_URL="https://your-domain.vercel.app"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
```

### Key Files

- **`/src/pages/Auth.tsx`** - Main authentication page (sign in / sign up)
- **`/src/pages/ForgotPassword.tsx`** - Password recovery request
- **`/src/pages/ResetPassword.tsx`** - Password reset form (accessed via email link)
- **`/src/lib/config.ts`** - URL configuration and utilities
- **`/src/lib/auth.tsx`** - Authentication context and hooks

### How It Works

1. **Sign In/Sign Up**
   - User submits credentials
   - Supabase authenticates via their service
   - Session created with secure HTTP-only cookies
   - User redirected to homepage

2. **Forgot Password**
   - User enters email
   - Supabase sends recovery email with `type=recovery` parameter
   - Email contains link to `/reset-password` on production domain
   - Link includes recovery token in URL hash

3. **Reset Password**
   - User clicks link from email
   - Recovery session is established by Supabase
   - User enters new password
   - Password updated via `supabase.auth.updateUser()`
   - User logged out and redirected to login

### Remember Device Implementation

```typescript
// Store when user checks "Remember this device"
localStorage.setItem("rememberDevice", JSON.stringify({ 
  email: userEmail, 
  timestamp: Date.now() 
}));

// Load on next visit
const saved = localStorage.getItem("rememberDevice");
const { email } = JSON.parse(saved);
setEmail(email); // Pre-fill form
```

### URL Handling

The app uses `/src/lib/config.ts` to ensure correct redirect URLs:

```typescript
getAppUrl()           // Returns production or dev URL
getResetPasswordUrl() // Returns reset page URL
getAuthCallbackUrl()  // Returns auth callback URL
```

This prevents the common issue of emails pointing to preview URLs.

### Authentication Context

```typescript
import { useAuth } from "@/lib/auth";

// In any component:
const { user, profile, loading, signOut, refreshProfile } = useAuth();

// Check if logged in:
if (!user) return <p>Not logged in</p>;

// Access user data:
console.log(user.email, profile.display_name, profile.coins);
```

### Common Issues & Solutions

**Problem**: Reset email links go to wrong website  
**Solution**: Ensure `VITE_APP_URL` is set correctly in environment variables

**Problem**: "Remember this device" not working  
**Solution**: Check browser localStorage is enabled

**Problem**: Session expires too quickly  
**Solution**: This is Supabase's default. Adjust in Supabase dashboard under Auth settings

**Problem**: Password reset fails  
**Solution**: Check Supabase email settings and recovery link expiration time

## Testing

### Test Sign In
1. Create a test account at `/auth`
2. Confirm email if required
3. Sign in with correct credentials
4. Should redirect to homepage

### Test Forgot Password
1. Go to `/forgot-password`
2. Enter test email
3. Check email inbox
4. Click recovery link
5. Reset password successfully
6. Sign in with new password

### Test Remember Device
1. Sign in with "Remember this device" checked
2. Sign out
3. Go back to `/auth`
4. Email should be pre-filled

## Security Notes

- All passwords are encrypted in transit (HTTPS only)
- Passwords stored securely by Supabase
- Sessions use HTTP-only cookies
- Never store passwords in localStorage
- Recovery links expire after 24 hours
- Email verification can be enabled in Supabase
