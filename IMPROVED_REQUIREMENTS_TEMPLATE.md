# CRM Workflow Requirements - Improved Template

> **Document Version**: 2.0  
> **Last Updated**: [Date]  
> **Status**: [Draft/Review/Approved]

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Goals & Objectives](#goals--objectives)
3. [Implementation Phases](#implementation-phases)
4. [Core Objects & Fields](#core-objects--fields)
5. [Integrations](#integrations)
6. [Automation Workflows](#automation-workflows)
7. [User Stories](#user-stories)
8. [Technical Requirements](#technical-requirements)
9. [Acceptance Criteria](#acceptance-criteria)
10. [Error Handling](#error-handling)
11. [Reporting & KPIs](#reporting--kpis)
12. [Configuration Management](#configuration-management)
13. [Testing Requirements](#testing-requirements)
14. [Data Migration](#data-migration)
15. [Maintenance & Support](#maintenance--support)
16. [Glossary](#glossary)

---

## Executive Summary

**Purpose**: Build a CRM that automates referral-focused nurturing, ingests JotForm entries, processes PDFs, and manages client communications.

**Key Features**:
- Automated referral campaigns
- JotForm integration with auto-contact creation
- PDF parsing for client profiles
- Failed payment rescue automation
- Portal redirect emails
- QR code tracking

**Timeline**: 6-8 weeks  
**Priority**: High

---

## Goals & Objectives

### Primary Goals
1. ✅ Automate referral-focused nurturing for existing clients
2. ✅ Ingest JotForm entries to schedule appointments
3. ✅ Use QR codes that route to JotForm intake
4. ✅ Convert dropped PDFs into client profiles
5. ✅ Segment contacts by role for targeted campaigns
6. ✅ Send easy "portal redirect" emails
7. ✅ Run failed-payment SMS + email sequence with manual toggle

### Success Metrics
- 30% increase in referral submissions
- 90%+ PDF parse accuracy
- <24 hour response time for new leads
- 80%+ payment recovery rate

---

## Implementation Phases

### Phase 1: Core MVP (Weeks 1-2) 🔴 Critical
- [ ] Contact management (CRUD)
- [ ] Basic JotForm webhook
- [ ] PDF upload (basic parsing)
- [ ] Simple dashboard
- [ ] Payment alert toggle

### Phase 2: Automation (Weeks 3-4) 🟡 High Priority
- [ ] Campaign system
- [ ] Referral drip automation
- [ ] Failed payment rescue
- [ ] Portal redirect emails
- [ ] QR code generation

### Phase 3: Advanced Features (Weeks 5-6) 🟢 Medium Priority
- [ ] Advanced PDF parsing (AI/OCR)
- [ ] Advanced reporting
- [ ] Role-based permissions
- [ ] Email template editor
- [ ] Bulk operations

---

## Core Objects & Fields

### Contact (Person)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstName | String | ✅ | |
| lastName | String | ✅ | |
| email | String | ❌ | Must be unique if provided |
| mobilePhone | String | ❌ | SMS-enabled, format: +1234567890 |
| address | String | ❌ | Full address |
| languagePreference | String | ❌ | Default: "English" |
| category | Enum | ✅ | See categories below |
| status | Enum | ✅ | Pipeline stage |
| emailOptIn | Boolean | ✅ | Default: false |
| smsOptIn | Boolean | ✅ | Default: false |
| paymentIssueAlert | Boolean | ✅ | Default: false |
| enrolledDate | DateTime | ❌ | For referral drip triggers |
| renewalDate | DateTime | ❌ | For renewal reminders |

**Categories**:
- `CONSUMER` - Active Client
- `DENTAL_OFFICE_PARTNER`
- `HEALTH_OFFICE_PARTNER`
- `OTHER_BUSINESS_PARTNER`
- `PROSPECT`

**Status Pipeline**:
- `LEAD` → `SCHEDULED` → `ENROLLED` → `ACTIVE_CLIENT`

**Tags**:
- Referral Source: [source name]
- Payment Issue Alert: ON/OFF
- "Red Alert: Payment" (auto-applied)
- Language: [language] (if not English)

### Policy/Plan

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| carrier | String | ❌ | Insurance carrier name |
| planType | String | ❌ | Plan type/category |
| monthlyPremium | Float | ❌ | Total premium amount |
| effectiveDate | DateTime | ❌ | |
| renewalDate | DateTime | ❌ | |
| paymentStatus | Enum | ✅ | GOOD, FAILED, AT_RISK |
| memberPortalLink | String | ❌ | URL |
| pharmacyLink | String | ❌ | URL |
| riderBenefitsLink | String | ❌ | URL |
| beneficiaryInfo | String | ❌ | JSON or text |

### Sensitive Data (Encrypted)

| Field | Type | Required | Encryption |
|-------|------|----------|------------|
| dob | String | ❌ | AES-256-GCM |
| ssn | String | ❌ | AES-256-GCM |

**Access Control**: Field-level permissions required

---

## Integrations

### JotForm → CRM

**Endpoint**: `POST /api/webhooks/jotform`

**Field Mapping**:
```
JotForm Field → CRM Field
firstName → firstName
lastName → lastName
email → email
phone/mobilePhone → mobilePhone
address → address
language → languagePreference
interestType → category
appointmentTime → (creates Scheduled status)
```

**Auto-Actions**:
1. Create/update Contact
2. Set status: `LEAD` (default) or `SCHEDULED` (if appointmentTime)
3. Create Task: "Confirm appointment" (due in 24h) if scheduled
4. Apply tags: Referral Source, Language (if not English)

**Acceptance Criteria**:
- ✅ Contact created within 5 seconds
- ✅ All mapped fields populated
- ✅ Status set correctly
- ✅ Task created if needed
- ✅ Tags applied

### QR Code → JotForm

**Generation**: `POST /api/qrcodes/generate`

**Parameters**:
- `jotFormUrl`: Full JotForm URL
- `source`: Location (Airport, Dental Office, etc.)

**UTM Parameters Added**:
- `utm_source`: [source]
- `utm_medium`: qr
- `utm_campaign`: referral

**Auto-Actions**:
- Generate QR code image
- Store in database with source tracking
- Auto-tag contact when form submitted

### PDF Drop → Profile Builder

**Endpoint**: `POST /api/contacts/[id]/upload-pdf`

**Extraction Fields**:
- Name (first, last, full)
- Address
- DOB
- SSN
- Plan type
- Monthly premium
- Beneficiaries
- Policy number
- Carrier

**Processing Rules**:
1. Only populate fields that are currently blank
2. Flag conflicts for manual review (confidence < 70%)
3. Store original PDF
4. Log parse result with confidence scores

**Acceptance Criteria**:
- ✅ 80%+ fields extracted with >70% confidence
- ✅ Conflicts flagged
- ✅ Original PDF stored
- ✅ Parse log created

---

## Automation Workflows

### Referral Drip Campaign

**Triggers**:
- 7 days after enrollment
- 90 days post-enrollment
- 180 days post-enrollment
- 30 days before renewal (requires renewalDate)

**Sequence**:
1. Day 7: Email with referral link
2. Day 7+1: SMS if no email click
3. Day 90: Follow-up email
4. Day 180: Bonus reminder email
5. Pre-renewal (30 days): Renewal referral email

**Configuration**:
- All timing configurable
- Email templates editable
- Referral link generation required

### Failed Payment Rescue

**Trigger**: Manual toggle ON

**Sequence**:
- Day 0: SMS + Email
- Day 3: Follow-up SMS + Email
- Day 7: Final reminder + Task for agent
- Day 10: Escalate task priority

**Stop Condition**: Toggle set to OFF

**Acceptance Criteria**:
- ✅ Red banner appears immediately
- ✅ Sequence starts within 1 minute
- ✅ All steps execute on schedule
- ✅ Stops immediately when toggle OFF

### Portal Redirect Email

**Trigger**: 
- On enrollment
- On plan change
- Manual send

**Content**:
- One-click buttons for all portal links
- Support contact info
- Agent contact block

**Templates**: Editable, supports variables

---

## User Stories

### As a Sales Agent
- I want to see all payment alerts in one view
- I want to quickly create contacts from JotForm
- I want PDFs to auto-populate contact fields
- I want to toggle payment alerts on/off easily

### As a Marketing Manager
- I want to track referral campaign performance
- I want to see QR code scan rates by location
- I want to customize email templates
- I want to create new campaign sequences

### As a System Administrator
- I want to audit all sensitive data access
- I want to configure campaign timing
- I want to monitor system health
- I want to manage user permissions

---

## Technical Requirements

### Performance
- Page load: < 2 seconds
- API response: < 500ms
- Support: 1000+ contacts
- Concurrent users: 10+

### Browser Support
- Chrome (latest 2)
- Firefox (latest 2)
- Safari (latest 2)
- Edge (latest 2)

### Data Storage
- Database: PostgreSQL (prod) / SQLite (dev)
- File storage: S3 (prod) / Local (dev)
- Backup: Daily
- Retention: 7 years

---

## Acceptance Criteria

### Contact Creation
- ✅ All required fields validated
- ✅ Email uniqueness enforced
- ✅ Status set correctly
- ✅ Tags applied
- ✅ Created in < 1 second

### PDF Parsing
- ✅ 80%+ fields extracted
- ✅ Confidence scores logged
- ✅ Conflicts flagged
- ✅ Original stored

### Campaign Processing
- ✅ Runs on schedule
- ✅ Respects opt-in flags
- ✅ Logs all sends
- ✅ Handles errors gracefully

---

## Error Handling

### JotForm Webhook Failures
- Retry: 3 times with exponential backoff
- Log: All failures to audit log
- Alert: Admin if 5+ failures/hour
- Fallback: Manual import option

### PDF Parsing Failures
- Log: Error with file/contact ID
- Notify: Agent via task
- Allow: Manual data entry
- Store: Original PDF for retry

### Email/SMS Failures
- Log: To EmailLog/SmsLog
- Retry: Once after 1 hour
- Mark: "Bounced" if 3+ failures
- Task: Agent to verify contact info

---

## Reporting & KPIs

### Metrics to Track

| Metric | Calculation | Target |
|--------|-------------|--------|
| Referral CTR | (Clicks / Emails) × 100 | >15% |
| QR Scan Rate | Scans by source | Track all |
| PDF Parse Success | (Successful / Total) × 100 | >80% |
| Payment Recovery | (Resolved / Alerts) × 100 | >80% |
| Response Time | Avg hours to first contact | <24h |

### Dashboards
- Overview: Key metrics at a glance
- Referrals: Campaign performance
- Payments: Recovery rates
- Contacts: Growth by category

---

## Configuration Management

### Campaign Timing (Configurable)
- Referral triggers: 7, 90, 180 days
- Pre-renewal: 30 days
- Payment intervals: 0, 3, 7, 10 days

### Email Templates (Editable)
- Portal redirect
- Referral requests
- Payment reminders
- Variables: [CONTACT_NAME], [LINK], etc.

### SLA Thresholds (Configurable)
- New lead: 24 hours
- Appointment: 12 hours
- Payment call: 24h after Day 7

---

## Testing Requirements

### Unit Tests
- Encryption/decryption
- PDF parsing logic
- Campaign triggers
- Data validation

### Integration Tests
- JotForm webhook flow
- PDF upload end-to-end
- Email/SMS sending
- Campaign processing

### UAT Scenarios
- Create contact from JotForm
- Upload and parse PDF
- Toggle payment alert
- Generate QR code
- Process referral campaign

---

## Data Migration

### Import Procedures
- CSV import for contacts
- Bulk PDF upload
- Field mapping guide
- Data validation rules

### Migration Checklist
- [ ] Export existing data
- [ ] Map to new schema
- [ ] Validate quality
- [ ] Import in batches
- [ ] Verify accuracy
- [ ] Archive originals

---

## Maintenance & Support

### Regular Tasks
- Daily: Campaign processing
- Weekly: Database backup
- Monthly: Review failed parses
- Quarterly: Audit log review
- Annually: Security audit

### Support Materials
- User training guides
- Troubleshooting docs
- Common issues FAQ
- Escalation procedures

---

## Glossary

- **Pipeline**: Contact stages (Lead → Scheduled → Enrolled → Active)
- **Drip Campaign**: Automated email/SMS sequence over time
- **UTM Parameters**: URL tracking codes
- **Confidence Score**: PDF parser certainty percentage
- **Red Alert**: Visual indicator for urgent issues
- **Opt-in**: Explicit consent for email/SMS

---

## Appendix

### API Endpoints Reference
[Link to API documentation]

### Database Schema
[Link to schema diagram]

### Email Templates
[Link to template library]

### Change Log
| Version | Date | Changes |
|---------|------|---------|
| 2.0 | [Date] | Improved structure, added sections |
| 1.0 | [Date] | Initial requirements |

