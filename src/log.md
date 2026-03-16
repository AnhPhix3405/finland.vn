# App Logs

## Performance Logging (mua-ban page)

### Logs format:
```
🔹 [PERF] Component mount started
🔹 [PERF] API /api/listings latency: X.XXXs
🔹 [PERF] Data mapping & setState: X.XXXs
🔹 [PERF] Total page load time: X.XXXs
🔹 [PERF] Component unmount - Total time: X.XXXs
```

### How to view:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with 🔹 [PERF]

---

## Media Picker Components

### AdminMediaPicker
- Location: `src/components/feature/AdminMediaPicker.tsx`
- Target type: `admin`
- Used in: RichTextEditor (for admin content editing)
- Shows images uploaded to admin library

### UserMediaPicker  
- Location: `src/components/feature/UserMediaPicker.tsx`
- Target type: `listing` (broker's listings)
- Used in: ListingForm (for brokers to select their existing images)
- Shows images from broker's own listings

### API Endpoints
- GET `/api/attachments?target_type=admin` - Admin images
- GET `/api/attachments?target_type=listing&target_id={listingId}` - Listing images

---

## Current Session
