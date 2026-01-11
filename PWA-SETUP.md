# Progressive Web App (PWA) Setup

## What is a PWA?

A Progressive Web App allows users to "install" your website on their device (phone, tablet, or desktop) without going through an app store. It works like a native app with:

- ✅ **Home screen icon**
- ✅ **Offline functionality**
- ✅ **Push notifications**
- ✅ **Full-screen experience**
- ✅ **Fast loading**

## Files Created

### 1. `manifest.json`
Defines app metadata (name, icons, colors, etc.)

### 2. `sw.js` (Service Worker)
Handles offline caching and background sync

### 3. `offline.html`
Fallback page shown when offline

### 4. `pwa-register.js`
Registers the service worker and handles install prompts

### 5. `layout.tsx` (Updated)
Added PWA meta tags and manifest link

## How to Install

### On Mobile (Android/iOS):

1. **Android (Chrome/Edge)**:
   - Visit https://mpesaconnect.co.ke
   - Tap the menu (⋮) → "Install app" or "Add to Home screen"
   - The app icon will appear on your home screen

2. **iOS (Safari)**:
   - Visit https://mpesaconnect.co.ke
   - Tap the Share button (□↑)
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add"

### On Desktop (Chrome/Edge):

1. Visit https://mpesaconnect.co.ke
2. Look for the install icon (⊕) in the address bar
3. Click "Install"
4. The app will open in its own window

## Icons Setup

You need to create app icons in various sizes. Place them in `/public/icons/`:

**Required sizes:**
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

**Quick way to generate:**
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo
3. Download all sizes
4. Place in `/public/icons/` folder

## Testing

### Test PWA locally:
```bash
npm run build
npm start
```

Then visit http://localhost:3001 and check:
1. Chrome DevTools → Application → Manifest
2. Chrome DevTools → Application → Service Workers
3. Try installing the app

### Test on mobile:
1. Deploy to server
2. Visit on mobile browser
3. Look for "Add to Home Screen" prompt

## Features

### ✅ Offline Support
- Cached pages work without internet
- Shows offline page when connection is lost

### ✅ Install Prompt
- Automatic install banner on supported browsers
- Custom install button (if you add one)

### ✅ Push Notifications
- Ready for push notification implementation
- Requires backend setup for sending notifications

### ✅ App-like Experience
- Runs in standalone mode (no browser UI)
- Custom splash screen
- Theme color matches your brand

## Deployment

After pushing to GitHub, deploy:

```bash
cd /var/www/mpesaconnect.co.ke/frontend
git pull origin main
npm run build
pm2 restart pesaflow-frontend
```

## Verification

After deployment, test:

1. **Lighthouse Audit**:
   - Chrome DevTools → Lighthouse
   - Run PWA audit
   - Should score 100%

2. **PWA Checklist**:
   - ✅ HTTPS enabled
   - ✅ Manifest file present
   - ✅ Service worker registered
   - ✅ Icons provided
   - ✅ Offline page works

## Customization

### Change App Colors:
Edit `manifest.json`:
```json
{
  "theme_color": "#6366f1",
  "background_color": "#ffffff"
}
```

### Add More Cached Pages:
Edit `sw.js`:
```javascript
const urlsToCache = [
  '/',
  '/dashboard',
  '/pos',
  '/products',
  // Add more pages
];
```

### Custom Install Button:
Add to any page:
```html
<button id="install-button" style="display: none;">
  Install App
</button>
```

## Browser Support

- ✅ Chrome (Android/Desktop)
- ✅ Edge (Android/Desktop)
- ✅ Samsung Internet
- ✅ Safari (iOS 16.4+)
- ✅ Firefox (limited)

## Benefits

1. **No App Store** - Users install directly from website
2. **Smaller Size** - No app download, uses cached web pages
3. **Always Updated** - No manual updates needed
4. **Cross-Platform** - Works on Android, iOS, Desktop
5. **SEO Friendly** - Still indexed by search engines
6. **Offline Access** - Works without internet

## Next Steps

1. ✅ Create app icons (use icon generator)
2. ✅ Deploy to server
3. ✅ Test installation on mobile
4. ✅ Run Lighthouse audit
5. ✅ Add custom install prompt (optional)
6. ✅ Set up push notifications (optional)

Your website is now an installable app! 🎉
