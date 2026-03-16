# App Logs

## Instructions
This file is auto-overwritten with application logs when the app runs.

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
