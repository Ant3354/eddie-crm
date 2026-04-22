# JotForm Webhook Setup Guide

## Per-form routing (dental / clinic / individual)

The CRM matches each submission’s **form ID** to automation in `lib/jotform-form-routing.ts` using environment variables:

| Variable | Purpose |
|----------|---------|
| `JOTFORM_FORM_ID_DENTAL` | Dental office form → tag **Dental Partner Lead** + **Dental Partner Lead Sequence** |
| `JOTFORM_FORM_ID_CLINIC` | Clinic form → tag **Clinic Partner Lead** + **Clinic Partner Lead Sequence** |
| `JOTFORM_FORM_ID_CLIENT` or `JOTFORM_FORM_ID` | Personal/client form → **Individual Lead** + **Individual Welcome Nurture** |

**Find your form IDs (recommended):** from the repo root, with a real `JOTFORM_API_KEY` in `.env` (Node 20+):

```bash
npm run jotform:list-forms
```

Copy the numeric **id** for each form into `.env` (local) and into **Vercel → Project → Settings → Environment Variables** (production). Redeploy or restart the dev server after changing env.

**Manual:** open each form in JotForm → **Publish** → the public URL looks like `https://form.jotform.com/123456789012345` — the long number is the form ID.

## Current Form
**Form URL:** https://form.jotform.com/253266939811163

## Webhook Configuration

### Step 1: Get Your Webhook URL
Your webhook URL is:
```
http://localhost:3001/api/webhooks/jotform
```

**For Production:**
```
https://your-domain.com/api/webhooks/jotform
```

### Step 2: Configure JotForm Webhook

1. Go to your JotForm form: https://form.jotform.com/253266939811163
2. Click **Settings** → **Integrations**
3. Find **Webhooks** and click **Add**
4. Enter your webhook URL
5. Select **POST** method
6. Click **Save**

### Step 3: Add Hidden Fields for QR Code Tracking (IMPORTANT)

To track QR code scans, you need to capture URL parameters:

1. In your JotForm form, add **Hidden Fields**:
   - Field Name: `qr_code_id`
   - Default Value: `{url:qr_code_id}` (JotForm will capture from URL)
   
   - Field Name: `referral_code`  
   - Default Value: `{url:referral_code}` (JotForm will capture from URL)

2. These fields will automatically capture URL parameters when someone scans the QR code

### Step 4: Test the Webhook

**Option A: Use Test Endpoint**
```
POST http://localhost:3001/api/webhooks/jotform/test-form?qr_code_id=YOUR_QR_ID
```

**Option B: Submit Test Form**
1. Generate a QR code in the CRM
2. Scan it or open the URL
3. Fill out the form
4. Submit
5. Check dashboard for the new contact

## How It Works

1. **QR Code Generation:**
   - QR codes include `qr_code_id` in the URL
   - Example: `https://form.jotform.com/253266939811163?qr_code_id=abc123&utm_source=Airport`

2. **Form Submission:**
   - JotForm sends webhook with form data
   - Hidden fields capture `qr_code_id` and `referral_code`
   - Webhook creates contact and tracks QR scan

3. **Dashboard Updates:**
   - New contact appears in Contacts
   - QR scan count increases
   - Referral clicks tracked (if referral code used)

## Troubleshooting

### Contacts Not Appearing

1. **Check Webhook URL:**
   - Verify webhook is configured in JotForm
   - Test with: `POST /api/webhooks/jotform/test-form`

2. **Check Server Logs:**
   - Look for "JotForm webhook received" in console
   - Check for error messages

3. **Verify Form Fields:**
   - Ensure "First Name" and "Last Name" fields exist
   - Ensure "Email" or "Phone Number" field exists

### QR Scans Not Tracking

1. **Add Hidden Fields:**
   - Add `qr_code_id` hidden field with default `{url:qr_code_id}`
   - This captures the QR code ID from URL

2. **Check QR Code URL:**
   - QR code should include `?qr_code_id=...` parameter
   - Verify when generating QR code

3. **Test QR Tracking:**
   - Use test endpoint with `?qr_code_id=test123`
   - Check dashboard for scan count increase

## Form Field Mapping

The webhook automatically maps these JotForm fields:

| JotForm Field | Maps To | Required |
|--------------|---------|----------|
| First Name | Contact First Name | Yes |
| Last Name | Contact Last Name | Yes |
| Email | Contact Email | Yes* |
| Phone Number | Contact Phone | Yes* |
| Zip Code | Address | No |
| Best time of day to reach you | Notes | No |
| Level of dental work needed | Category | No |
| Additional notes | Notes | No |
| Name of the dental office referring you | Source | No |

*At least one of Email or Phone is required

## Testing

### Test Webhook Directly:
```bash
curl -X POST http://localhost:3001/api/webhooks/jotform/test-form \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test with QR Code ID:
```bash
curl -X POST "http://localhost:3001/api/webhooks/jotform/test-form?qr_code_id=test-qr-123" \
  -H "Content-Type: application/json"
```

## Next Steps

1. ✅ Configure webhook in JotForm
2. ✅ Add hidden fields for QR tracking
3. ✅ Generate a QR code in CRM
4. ✅ Test form submission
5. ✅ Verify contact appears on dashboard
6. ✅ Check QR scan count increases

