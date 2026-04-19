# Troubleshooting Guide - Authentication Issues

## Reset Password Email Redirects to Wrong Site

### Symptoms
- User clicks reset link in email
- Gets sent to Lovable.ai or other preview URL
- Can't access the actual reset password form

### Root Cause
`window.location.origin` changes based on where the app is running

### Solutions

#### Solution 1: Set Environment Variable (BEST)
1. Go to Vercel Project Settings
2. Under "Environment Variables", add:
   ```
   VITE_APP_URL=https://smooth-pay-buddy.vercel.app
   ```
3. Deploy again
4. Test reset password flow

#### Solution 2: Check .env File
If testing locally:
```
VITE_APP_URL=http://localhost:5173
```

#### Solution 3: Verify Supabase Configuration
1. Login to Supabase dashboard
2. Go to Auth → Providers → Email
3. Check "Email Redirect URL" is not set to something specific
4. Let it use the redirectTo parameter from the code

### How to Test
1. Go to `/forgot-password`
2. Enter a test email
3. Open developer console (F12)
4. Look for the redirect URL being used
5. It should match your `VITE_APP_URL`

---

## Login Page Shows Blank or Broken

### Symptoms
- Auth page is blank
- Form doesn't appear
- Console shows JavaScript errors

### Debugging Steps

1. **Open Browser Console**
   - Press F12 or right-click → Inspect
   - Go to Console tab
   - Look for red error messages

2. **Common Errors**
   - `TypeError: Cannot read property 'email'` - Import issue
   - `Module not found` - Missing component
   - `undefined is not an object` - State initialization issue

3. **Check Components**
   - Verify `/src/components/ui/checkbox.tsx` exists
   - Verify all imports in `/src/pages/Auth.tsx` are correct
   - Check that `Button`, `Input`, `Card` components exist

### Fix Attempts

**Attempt 1: Clear Browser Cache**
```
Windows: Ctrl+Shift+Delete
Mac: Cmd+Shift+Delete
Then select "All time" → Clear data
```

**Attempt 2: Check Imports**
Open `/src/pages/Auth.tsx` and verify imports:
```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
```

**Attempt 3: Rebuild Project**
```bash
npm run build
npm run dev
```

---

## Password Reset Email Doesn't Arrive

### Symptoms
- User submits forgot password form
- Success message shows
- Email never arrives in inbox
- Even checked spam folder

### Check These First

1. **Is the email address correct?**
   - No typos?
   - Actually has an account?
   - Try the exact address used for signup

2. **Check email settings in Supabase**
   - Login to Supabase dashboard
   - Go to Auth → Providers → Email
   - Check "Email enabled" is ON
   - Verify sender email is valid

3. **Check email templates**
   - Dashboard → Auth → Email Templates
   - Confirm "Reset Password" template exists
   - Check it includes the reset link

### Common Issues & Solutions

**Issue: "The email service is not configured"**
- Solution: Go to Supabase → Settings → Email Provider
- Add a real email service (SendGrid, AWS SES, etc.)
- Or use Supabase's default email service

**Issue: "Reset link points to wrong URL"**
- Solution: See "Reset Password Email Redirects" section above
- Ensure `VITE_APP_URL` is set correctly

**Issue: Spam folder**
- Solution: Nothing you can do - email deliverability depends on ISP
- Can improve by configuring proper email authentication (SPF, DKIM)

---

## "Remember This Device" Not Working

### Symptoms
- User checks the box
- Signs out
- Email field is empty next time
- Have to type email again

### Debugging

1. **Check Browser Storage**
   - Press F12 → Application tab
   - Find "Local Storage"
   - Look for "rememberDevice" key
   - Should contain: `{"email":"user@example.com","timestamp":123456}`

2. **Common Causes**
   - Private/Incognito mode (localStorage disabled)
   - Third-party cookies disabled
   - Browser security settings too strict
   - Mobile Safari's "Privacy Mode"

3. **Test Steps**
   - Sign in with "Remember this device" checked
   - Open DevTools → Application
   - Refresh page (don't close browser)
   - Check if email appears
   - Close browser completely, reopen
   - Check if email still appears

---

## Form Validation Errors Don't Show

### Symptoms
- Click submit with empty fields
- No error messages appear
- Form just doesn't submit

### Check These

1. **Is the error div rendering?**
   ```
   Open DevTools → Elements
   Search for "p-3 rounded-lg bg-coral"
   Should be there (even if hidden)
   ```

2. **Is error state being set?**
   ```javascript
   // Add to browser console
   window.localStorage.setItem("debug", "true");
   // Then try form submission
   // Look for error in console
   ```

3. **CSS Issue?**
   - Error text might be rendering but color is wrong
   - Go to DevTools → Inspect the error div
   - Check computed styles
   - Verify `color: coral` is applied

---

## Sign In/Sign Up Loop (Keeps Redirecting)

### Symptoms
- After login, redirected back to `/auth`
- Session not persisting
- User gets stuck in loop

### Root Causes

1. **Supabase Connection Failed**
   - Check internet connection
   - Verify Supabase project is active
   - Check `VITE_SUPABASE_URL` is correct

2. **Session Not Created**
   - Look in DevTools → Application → Cookies
   - Should see `sb-*` cookies (Supabase session)
   - If missing, Supabase isn't creating session

3. **AuthProvider Issue**
   - Check `AuthProvider` wraps the app in `/src/App.tsx`
   - Verify `useAuth()` is being called correctly

### Debugging Steps

1. **Check Supabase Connection**
   ```javascript
   // In browser console
   import { supabase } from "@/integrations/supabase/client";
   supabase.auth.getSession().then(data => console.log(data));
   ```

2. **Verify Environment Variables**
   - Press F12
   - In console: `console.log(import.meta.env.VITE_SUPABASE_URL)`
   - Should show your Supabase URL, not "undefined"

3. **Check User Profile**
   - If signed in, check if profile loads
   - Look for network requests in DevTools → Network
   - Should see `profiles` table query
   - If 403 error, RLS policies might be blocking

---

## Password Reset Shows "Session Expired"

### Symptoms
- User clicks reset link from email
- Gets "Invalid reset link or session expired" message
- Happens even immediately after requesting

### Causes

1. **Reset Link Expired**
   - Default expiry is 24 hours
   - User waited too long to click link
   - Solution: Request new reset link

2. **Wrong URL in Email**
   - Email pointing to development URL
   - See "Reset Password Email Redirects" section
   - Set `VITE_APP_URL` correctly

3. **Session Lost**
   - Browser cleared cookies
   - Opened link in different browser
   - Solution: Request new reset link

### How to Increase Expiry Time

1. Go to Supabase dashboard
2. Auth → Settings
3. Find "Email auth expiry duration"
4. Increase from default 24h to 48h or higher

---

## Console Shows TypeScript Errors

### Common Errors

```
"Argument of type 'string' is not assignable to parameter of type 'ToneType'"
```
**Solution**: Check tone values are one of: "polite", "neutral", "snarky", "brutal"

```
"Cannot find module '@/components/ui/checkbox'"
```
**Solution**: Run `npm install` or verify checkbox.tsx exists in components/ui

```
"Type 'string | undefined' is not assignable to type 'string'"
```
**Solution**: Add null check or use default value: `email || ""`

---

## Performance Issues / Slow Loading

### Symptoms
- Auth pages load slowly
- Form lags when typing
- Network tab shows slow requests

### Debugging

1. **Check Network Tab**
   - DevTools → Network → reload page
   - Should see quick response times (<500ms)
   - If Supabase calls slow, check their status page

2. **Check Browser Extensions**
   - Disable extensions and reload
   - Some block localStorage or cookies
   - Test in incognito mode

3. **Check Network Speed**
   - Use DevTools → Network → Throttle
   - Set to "Slow 3G"
   - See if app works on slow connection

---

## "CORS Error" or "Blocked by Corsecurity"

### Symptoms
- Error message mentions CORS or Cross-Origin
- Cannot make requests to Supabase
- Localhost works but production doesn't

### Solution

1. **Check Supabase CORS Settings**
   - Go to Supabase dashboard
   - Project Settings → API
   - Find "Allowed origins"
   - Add your production domain:
     ```
     https://smooth-pay-buddy.vercel.app
     ```

2. **Verify No Typos**
   - Must be exact domain
   - Must include https://
   - No trailing slash

3. **Wait for Cache**
   - Supabase changes take 1-2 minutes
   - Clear browser cache and retry

---

## Getting Help

If you're still stuck:

1. **Check browser console** (F12 → Console tab)
2. **Share the exact error message**
3. **Describe what you were doing when it happened**
4. **List environment variables that are set**
5. **Check Supabase dashboard status**

---

## Quick Fixes Checklist

- [ ] Set `VITE_APP_URL` in environment variables
- [ ] Clear browser cache and cookies
- [ ] Close and reopen browser
- [ ] Verify Supabase project is active
- [ ] Check internet connection
- [ ] Run `npm run build` to verify no build errors
- [ ] Check browser console for errors (F12)
- [ ] Test in incognito/private mode
- [ ] Test on different browser
- [ ] Check Supabase email configuration

If all above checked and issue persists, it's likely an environment or infrastructure issue.
