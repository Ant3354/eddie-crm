# JotForm Webhook Testing & Troubleshooting

## Current Status

✅ **QR Code History** - Fixed! QR codes now persist and show in history
✅ **Webhook Endpoint** - Active at: `http://localhost:3001/api/webhooks/jotform`

## Testing the Webhook

### Option 1: Test Endpoint
```bash
POST http://localhost:3001/api/webhooks/jotform/test-form?qr_code_id=YOUR_QR_ID
```

### Option 2: Direct Webhook Test
```bash
curl -X POST http://localhost:3001/api/webhooks/jotform \
  -H "Content-Type: application/json" \
  -d '{
    "formID": "253266939811163",
    "submissionID": "test-123",
    "answers": [
      {"id": "3", "name": "First Name", "answer": "John"},
      {"id": "4", "name": "Last Name", "answer": "Doe"},
      {"id": "8", "name": "Phone Number", "answer": "555-1234"},
      {"id": "9", "name": "Email", "answer": "john@example.com"}
    ]
  }'
```

### Option 3: Debug Endpoint
```bash
GET http://localhost:3001/api/webhooks/jotform/debug
```

## JotForm Configuration

### Step 1: Configure Webhook in JotForm

1. Go to: https://form.jotform.com/253266939811163
2. Click **Settings** → **Integrations** → **Webhooks**
3. Click **Add Webhook**
4. Enter URL: `http://localhost:3001/api/webhooks/jotform`
   - **For Production:** `https://your-domain.com/api/webhooks/jotform`
5. Method: **POST**
6. Click **Save**

### Step 2: Add Hidden Fields (IMPORTANT for QR Tracking)

1. In JotForm form editor, add **Hidden Field**:
   - Field Name: `qr_code_id`
   - Default Value: `{url:qr_code_id}`

2. (Optional) Add another **Hidden Field**:
   - Field Name: `referral_code`
   - Default Value: `{url:referral_code}`

This captures URL parameters when someone scans the QR code.

## What Happens When Form is Submitted

1. ✅ JotForm sends webhook to `/api/webhooks/jotform`
2. ✅ Webhook parses form data (First Name, Last Name, Email, Phone, etc.)
3. ✅ Creates or updates contact in CRM
4. ✅ Tracks QR scan (if QR code ID provided)
5. ✅ Tracks referral (if referral code provided)
6. ✅ Contact appears on dashboard immediately

## Troubleshooting

### Contact Not Appearing After Submission

1. **Check Webhook Configuration:**
   - Verify webhook URL in JotForm settings
   - Check webhook is enabled

2. **Check Server Logs:**
   - Look for "JotForm webhook received" in console
   - Check for error messages

3. **Test Webhook Manually:**
   - Use test endpoint: `/api/webhooks/jotform/test-form`
   - Check debug endpoint: `/api/webhooks/jotform/debug`

4. **Verify Form Fields:**
   - Form must have "First Name" and "Last Name" fields
   - Form must have "Email" OR "Phone Number" field

### QR Scans Not Tracking

1. **Add Hidden Field:**
   - Add `qr_code_id` hidden field with default `{url:qr_code_id}`
   - This is REQUIRED for QR tracking

2. **Check QR Code URL:**
   - QR code should include `?qr_code_id=...` parameter
   - Verify when generating QR code

3. **Test QR Tracking:**
   - Generate QR code
   - Use test endpoint with `?qr_code_id=YOUR_QR_ID`
   - Check dashboard for scan count increase

### Referral Clicks Not Showing

1. **Check Dashboard:**
   - Go to: http://localhost:3001/dashboard
   - Look for "Referral Clicks" stat card
   - Should update after form submission

2. **Check Referral Code:**
   - Ensure referral code is in QR code URL
   - Or passed in form submission

## Verification Checklist

- [ ] Webhook configured in JotForm
- [ ] Hidden fields added for QR tracking
- [ ] Test form submission
- [ ] Check contacts appear on dashboard
- [ ] Check QR scan count increases
- [ ] Check referral clicks tracked
- [ ] Verify contact details are correct

## Next Steps

1. **Configure JotForm webhook** with your webhook URL
2. **Add hidden fields** for QR code tracking
3. **Test submission** by filling out the form
4. **Verify** contact appears on dashboard
5. **Check** QR code history shows all generated codes

## Support

If issues persist:
1. Check server console for error messages
2. Test webhook with test endpoint
3. Verify JotForm webhook configuration
4. Check that hidden fields are added correctly
5. Use debug endpoint to check webhook status

