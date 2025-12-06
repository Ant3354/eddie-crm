# JotForm Webhook Field Mapping

## Issue
Contact information doesn't match what was filled out in the form.

## Root Cause
JotForm sends data in a specific format that needs to be parsed correctly. The webhook now has enhanced parsing to handle all variations.

## Field Mapping

### Your Form Fields → CRM Fields

| JotForm Field | Field ID | CRM Field | Status |
|--------------|----------|-----------|--------|
| First Name | 3 | firstName | ✅ Mapped |
| Last Name | 4 | lastName | ✅ Mapped |
| Phone Number | 8 | mobilePhone | ✅ Mapped |
| Email | 9 | email | ✅ Mapped |
| Zip Code? | 7 | address | ✅ Mapped |
| Level of dental work needed ? | 11 | category | ✅ Mapped |
| Best time of day to reach you? | 10 | notes | ✅ Mapped |
| Name of the dental office referring you? | 14 | source | ✅ Mapped |
| Additional notes: | 13 | notes | ✅ Mapped |

## How to Debug

### Step 1: Check Server Logs
When a form is submitted, check the server console for:
```
📥 JotForm webhook received: {...}
📋 Parsed answer map: {...}
✅ Extracted data: {...}
```

This shows exactly what JotForm sent and how it was parsed.

### Step 2: Check Recent Submissions
Visit: `GET http://localhost:3001/api/webhooks/jotform/log`

This shows all recent contacts created via webhook with their actual data.

### Step 3: Test with Real Data
1. Fill out the form with your actual information
2. Submit the form
3. Check the server console logs
4. Check the contact in CRM
5. Compare what you entered vs what appears

## Common Issues

### Issue 1: Test Data Appearing
**Symptom:** Seeing `test1956663987@example.com` instead of your email

**Cause:** The test endpoint was used, or JotForm sent test data

**Solution:** 
- Make sure you're submitting the actual form, not using test endpoint
- Check JotForm webhook configuration
- Verify the webhook URL is correct

### Issue 2: Field Names Don't Match
**Symptom:** Some fields are empty or wrong

**Cause:** JotForm field names might have variations (e.g., "Phone Number" vs "Phone")

**Solution:**
- The webhook now handles multiple variations
- Check server logs to see what field names JotForm is sending
- Field IDs are used as fallback (more reliable)

### Issue 3: Data Not Appearing
**Symptom:** Contact created but fields are empty

**Cause:** JotForm might be sending data in a different format

**Solution:**
- Check server logs for the raw webhook payload
- Verify JotForm webhook is configured correctly
- Test with the debug endpoint

## Enhanced Parsing

The webhook now:
- ✅ Handles field name variations (with/without question marks, spaces, etc.)
- ✅ Uses field IDs as fallback (more reliable)
- ✅ Handles different answer formats (strings, objects, arrays)
- ✅ Logs everything for debugging
- ✅ Maps all your form fields correctly

## Testing

### Test with Your Actual Form:
1. Go to: https://form.jotform.com/253266939811163
2. Fill out with real data:
   - First Name: Your actual first name
   - Last Name: Your actual last name
   - Email: Your actual email
   - Phone: Your actual phone
3. Submit
4. Check CRM contact - should match what you entered

### Check Logs:
```bash
# View recent submissions
GET http://localhost:3001/api/webhooks/jotform/log

# Check server console for detailed logs
```

## Next Steps

1. **Submit a real form** with your actual information
2. **Check server console** for the webhook logs
3. **Verify the contact** in CRM matches what you entered
4. **If still wrong**, check the server logs to see what JotForm actually sent

The webhook is now enhanced to handle all variations of your form fields!

