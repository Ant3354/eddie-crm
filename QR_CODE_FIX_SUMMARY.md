# ✅ QR Code & JotForm Webhook Fixes

## Issues Fixed

### 1. QR Code Tracking Not Working
**Problem:** QR scans weren't being tracked when forms were submitted.

**Solution:**
- ✅ QR codes now include `qr_code_id` parameter in the URL
- ✅ Webhook automatically tracks QR scans when form is submitted
- ✅ QR scan count updates in real-time on dashboard

### 2. JotForm Field Parsing
**Problem:** Webhook couldn't parse your specific form fields.

**Solution:**
- ✅ Enhanced field mapping for your dental insurance form
- ✅ Handles "First Name" / "Last Name" as separate fields
- ✅ Maps "Phone Number", "Email", "Zip Code" correctly
- ✅ Captures "Name of the dental office referring you" as source
- ✅ Handles "Level of dental work needed" and other fields

### 3. Referral Code Tracking
**Problem:** Referral codes from QR URLs weren't being captured.

**Solution:**
- ✅ Webhook extracts referral codes from URL parameters
- ✅ Also checks form data for referral codes
- ✅ Tracks referral clicks and conversions automatically

## How to Test

### Step 1: Generate a QR Code
1. Go to: http://localhost:3001/qrcodes
2. Enter your JotForm URL: `https://form.jotform.com/253266939811163`
3. Select a source (e.g., "Dental Office")
4. Click "Generate QR Code"
5. **Note the QR Code ID** - you'll need this

### Step 2: Configure JotForm (IMPORTANT!)

**Add Hidden Fields to Capture QR Code ID:**

1. In JotForm, go to your form editor
2. Add a **Hidden Field**:
   - Field Name: `qr_code_id`
   - Default Value: `{url:qr_code_id}`
   
3. Add another **Hidden Field** (optional):
   - Field Name: `referral_code`
   - Default Value: `{url:referral_code}`

This allows JotForm to capture the URL parameters when someone scans the QR code.

### Step 3: Configure Webhook

1. In JotForm, go to **Settings** → **Integrations** → **Webhooks**
2. Add webhook URL: `http://localhost:3001/api/webhooks/jotform`
3. Method: **POST**
4. Save

### Step 4: Test the Flow

**Option A: Test Endpoint (Quick Test)**
```
POST http://localhost:3001/api/webhooks/jotform/test-form?qr_code_id=YOUR_QR_ID
```

**Option B: Real Test**
1. Scan the generated QR code (or open the URL)
2. Fill out the form with test data
3. Submit the form
4. Check dashboard:
   - ✅ New contact should appear
   - ✅ QR scan count should increase
   - ✅ Referral clicks tracked (if referral code used)

## What's Fixed

### QR Code Generation (`lib/qrcode.ts`)
- ✅ QR codes now include `qr_code_id` in URL
- ✅ QR code ID is stored in database
- ✅ URL format: `https://form.jotform.com/...?qr_code_id=abc123&utm_source=...`

### Webhook Handler (`app/api/webhooks/jotform/route.ts`)
- ✅ Extracts QR code ID from URL parameters
- ✅ Tracks QR scan when form is submitted
- ✅ Improved field parsing for your form structure
- ✅ Better error handling and logging
- ✅ Tracks referral codes automatically

### Field Mapping
The webhook now correctly maps:
- ✅ "First Name" → Contact First Name
- ✅ "Last Name" → Contact Last Name  
- ✅ "Phone Number" → Contact Phone
- ✅ "Email" → Contact Email
- ✅ "Zip Code" → Address
- ✅ "Name of the dental office referring you" → Source
- ✅ "Additional notes" → Notes
- ✅ "Level of dental work needed" → Category

## Dashboard Updates

After a form submission:
- ✅ **Total Contacts** increases
- ✅ **QR Scans** count increases (if QR code was used)
- ✅ **Referral Clicks** tracked (if referral code was used)
- ✅ New contact appears in Contacts list

## Testing Checklist

- [ ] Generate QR code in CRM
- [ ] Add hidden fields to JotForm
- [ ] Configure webhook in JotForm
- [ ] Scan QR code or open URL
- [ ] Fill out form
- [ ] Submit form
- [ ] Verify contact appears on dashboard
- [ ] Verify QR scan count increases
- [ ] Check contact details are correct

## Troubleshooting

### Contact Not Appearing
1. Check webhook is configured in JotForm
2. Check server logs for "JotForm webhook received"
3. Verify form has "First Name" and "Last Name" fields
4. Test with: `POST /api/webhooks/jotform/test-form`

### QR Scans Not Tracking
1. **CRITICAL:** Add hidden field `qr_code_id` with default `{url:qr_code_id}`
2. Verify QR code URL includes `?qr_code_id=...`
3. Check webhook logs for QR code ID

### Referral Clicks Not Tracking
1. Add hidden field `referral_code` with default `{url:referral_code}`
2. Include `referral_code` in QR code URL
3. Check referral stats on dashboard

## Next Steps

1. **Configure JotForm:**
   - Add hidden fields for QR tracking
   - Set up webhook URL

2. **Test:**
   - Generate QR code
   - Submit test form
   - Verify everything works

3. **Deploy:**
   - Update webhook URL to production domain
   - Test in production environment

## Files Changed

- `lib/qrcode.ts` - QR code generation with tracking
- `app/api/webhooks/jotform/route.ts` - Enhanced webhook handler
- `app/api/webhooks/jotform/test-form/route.ts` - Test endpoint (NEW)

## Support

If issues persist:
1. Check server console for error messages
2. Test webhook with test endpoint
3. Verify JotForm webhook configuration
4. Check that hidden fields are added correctly

