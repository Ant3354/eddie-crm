# 🔧 Critical Fixes Needed

Based on the requirements gap analysis, here are the fixes needed to match the requirements document exactly.

## 🚨 Priority 1: Campaign Automation

**Problem**: Campaigns exist but never run automatically

**Fix**: Add scheduled processing

```typescript
// Create: app/api/cron/process-campaigns/route.ts
// Or use: pages/api/cron/process-campaigns.ts
// Or: lib/scheduler.ts with setInterval
```

**Action**: Create automatic campaign processor

---

## 🚨 Priority 2: Day 10 Escalation

**Problem**: Failed payment sequence missing Day 10 task escalation

**Fix**: Add Day 10 step to `startFailedPaymentSequence()`

```typescript
{
  stepOrder: 7,
  triggerDays: 10,
  channel: 'TASK',
  subject: 'URGENT: Escalate Payment Issue',
  content: 'Client has not responded after 10 days. Escalate priority and call immediately.',
  // Set priority to HIGH
}
```

**Action**: Update `lib/campaigns.ts` failed payment sequence

---

## 🚨 Priority 3: Category-Specific Campaigns

**Problem**: Only 1 campaign seeded, missing 7+ required campaigns

**Fix**: Add all category campaigns to seed file

**Required Campaigns**:
1. Consumer: Renewal Reminders
2. Consumer: Seasonal Benefit Reminders  
3. Consumer: Portal Help
4. Dental Office Partner: Referral Partnership
5. Dental Office Partner: Benefits Day Scheduling
6. Health Office Partner: Partnership Emails
7. Health Office Partner: Patient Education Invites
8. Other Business Partner: Employee Coverage
9. Other Business Partner: Referral Incentives
10. Prospect: Nurture Sequence

**Action**: Update `prisma/seed.ts`

---

## 🚨 Priority 4: Conditional Referral Tasks

**Problem**: Tasks not conditional on click tracking

**Fix**: Add click tracking check before creating task

```typescript
// Check if referral link was clicked
const referralLink = await prisma.referralLink.findUnique({
  where: { contactId: contact.id }
})
const clickCount = referralLink?.clickCount || 0

// Only create task if no clicks after 2 attempts
if (clickCount === 0 && attemptCount >= 2) {
  // Create task
}
```

**Action**: Update referral drip campaign logic

---

## 🚨 Priority 5: Plan Change Trigger

**Problem**: Portal email doesn't auto-send on plan change

**Fix**: Add trigger when policy is updated

```typescript
// In policy update endpoint
if (planTypeChanged || carrierChanged) {
  await sendPortalEmail(contactId)
}
```

**Action**: Update policy update endpoint

---

## ⚠️ Priority 6: PDF Conflict Flagging

**Problem**: No conflict detection for PDF parsing

**Fix**: Add conflict detection logic

```typescript
// Compare parsed value with existing value
if (existingValue && parsedValue && existingValue !== parsedValue) {
  // Flag for manual review
  await prisma.file.update({
    where: { id: fileId },
    data: { 
      parseResult: JSON.stringify({
        ...parsedData,
        conflicts: [{ field: 'firstName', existing: existingValue, parsed: parsedValue }]
      })
    }
  })
}
```

**Action**: Update PDF parser

---

## ⚠️ Priority 7: SLA Tracking

**Problem**: Tasks created but SLAs not monitored

**Fix**: Add SLA tracking and alerts

```typescript
// Check task SLAs
const overdueTasks = await prisma.task.findMany({
  where: {
    status: 'PENDING',
    dueDate: { lt: new Date() }
  }
})
// Send alerts for overdue tasks
```

**Action**: Create SLA monitoring system

---

## ⚠️ Priority 8: Reporting Dashboard

**Problem**: Data collected but reports not built

**Fix**: Build reporting endpoints and dashboard

**Required Reports**:
- Referral click-through rate
- QR scan-to-appointment conversion
- PDF parse success rate
- Failed payment resolution time
- Renewal retention rate
- Category growth

**Action**: Create reporting API and dashboard

---

## 📋 Quick Fix Checklist

- [ ] Add campaign automation (cron/scheduler)
- [ ] Add Day 10 escalation to failed payment
- [ ] Seed all category-specific campaigns
- [ ] Add conditional referral task logic
- [ ] Add plan change trigger for portal email
- [ ] Add PDF conflict flagging
- [ ] Add SLA tracking
- [ ] Build reporting dashboard

---

## 🎯 Estimated Time

- Campaign automation: 1-2 hours
- Day 10 escalation: 30 minutes
- Category campaigns: 2-3 hours
- Conditional tasks: 1 hour
- Plan change trigger: 30 minutes
- PDF conflicts: 1 hour
- SLA tracking: 2 hours
- Reporting: 3-4 hours

**Total**: ~12-15 hours to reach 100% compliance

