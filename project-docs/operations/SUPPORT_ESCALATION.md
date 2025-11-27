# Support Escalation

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Owner:** System Administrator

---

## Table of Contents

1. [Overview](#overview)
2. [Support Tiers](#support-tiers)
3. [Issue Classification](#issue-classification)
4. [Escalation Matrix](#escalation-matrix)
5. [Support Request Process](#support-request-process)
6. [Escalation Procedures](#escalation-procedures)
7. [Response Time SLAs](#response-time-slas)
8. [Common Issues and Solutions](#common-issues-and-solutions)
9. [Support Contact Information](#support-contact-information)
10. [Support Ticket Template](#support-ticket-template)

---

## Overview

This document defines the support escalation process for the Stock Management System. It ensures users receive timely assistance and critical issues are escalated appropriately.

### Support Objectives

- **Resolve issues quickly:** Minimize downtime and user frustration
- **Escalate appropriately:** Route complex issues to the right resources
- **Track all requests:** Maintain support ticket log for analysis
- **Continuous improvement:** Learn from support patterns to improve system

### Support Channels

| Channel | Use For | Response Time |
|---------|---------|---------------|
| **Email** (support@company.com) | General questions, how-to, minor issues | 4 business hours |
| **Phone** ([TO BE FILLED]) | Urgent issues, system down | 1 hour (business hours) |
| **In-Person** (Supervisor/Admin) | Training, complex workflows | Scheduled |
| **Self-Service** (Documentation) | Common questions, reference | Immediate |

---

## Support Tiers

### Tier 1: Self-Service

**Who:** End users

**Resources:**
- User Manual (`USER_MANUAL.md`)
- Quick Reference Card (`QUICK_REFERENCE_CARD.md`)
- FAQ (`FAQ.md`)
- In-app help text and tooltips

**Handles:**
- How-to questions
- Common workflows
- Feature explanations
- Password resets (via forgot password link)

**Example Questions:**
- "How do I create a delivery?"
- "What does WAC mean?"
- "How do I switch locations?"
- "Where do I find stock levels?"

### Tier 2: First-Line Support

**Who:** Supervisors, Power Users

**Skills Required:**
- Deep knowledge of system workflows
- Familiar with common issues
- Can troubleshoot basic problems
- Can guide users through processes

**Handles:**
- User training and onboarding
- Workflow guidance
- Basic troubleshooting
- Data entry corrections (within permissions)
- Access requests

**Escalates to Tier 3:**
- System errors or bugs
- Performance issues
- Data corruption
- Permission issues
- Feature requests

**Example Issues:**
- "I can't find an item in the list"
- "How do I approve a transfer?"
- "The reconciliation numbers don't match"
- "Can you walk me through month-end close?"

### Tier 3: Technical Support

**Who:** System Administrator, Development Team

**Skills Required:**
- System administration
- Database access
- Code understanding
- Third-party service knowledge (Vercel, Supabase)

**Handles:**
- System errors and bugs
- Performance issues
- Database queries and reports
- User permission management
- System configuration
- Integration issues

**Escalates to Tier 4:**
- Critical outages
- Data loss
- Security breaches
- Infrastructure failures

**Example Issues:**
- "Users are getting 500 errors"
- "API responses are very slow"
- "Database query is timing out"
- "Need to restore from backup"

### Tier 4: Vendor Support / Emergency

**Who:** Vercel Support, Supabase Support, External Consultants

**When to Escalate:**
- Platform outages (Vercel, Supabase)
- Infrastructure failures
- Critical security incidents
- Data recovery beyond internal capabilities

**Contact:**
- Vercel Support: support@vercel.com, https://vercel.com/support
- Supabase Support: support@supabase.com, https://app.supabase.com/support

---

## Issue Classification

### Priority Levels

| Priority | Impact | Response Time | Examples |
|----------|--------|---------------|----------|
| **P1 - Critical** | System down, blocking all users | 1 hour | Application unavailable, database down, data loss |
| **P2 - High** | Major feature broken, blocking some users | 4 hours | Login fails, period close fails, transfers not approving |
| **P3 - Medium** | Feature degraded, workaround available | 1 business day | Slow performance, minor UI bugs, incorrect calculations |
| **P4 - Low** | Minor issue, cosmetic, enhancement request | 1 week | Typos, UI improvements, feature requests |

### Issue Categories

**1. How-To / Training**
- User doesn't know how to perform a task
- Needs guidance on workflow
- Wants to learn a feature

**Resolution:** Tier 1 or 2 (Self-service or Supervisor)

**2. Data Issue**
- Incorrect data entered
- Need to correct a transaction
- Data doesn't match expectations

**Resolution:** Tier 2 or 3 (Supervisor or Admin)

**3. Access Issue**
- Cannot log in
- Permission denied
- Cannot access a location

**Resolution:** Tier 2 or 3 (Supervisor or Admin)

**4. System Error**
- Error message displayed
- Feature not working as expected
- Unexpected behavior

**Resolution:** Tier 3 (Technical Support)

**5. Performance Issue**
- Slow page loads
- Timeouts
- Unresponsive UI

**Resolution:** Tier 3 (Technical Support)

**6. Feature Request**
- Want new functionality
- Suggest improvement
- Report usability issue

**Resolution:** Tier 3 (logged for future development)

---

## Escalation Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                   Escalation Flow                            │
└─────────────────────────────────────────────────────────────┘

User Issue
    ↓
┌─────────────────┐
│  Tier 1:        │
│  Self-Service   │
│  (User Manual,  │
│   FAQ, Docs)    │
└────────┬────────┘
         │
         │ Not Resolved?
         ↓
┌─────────────────┐
│  Tier 2:        │
│  First-Line     │
│  (Supervisor,   │
│   Power User)   │
└────────┬────────┘
         │
         │ Technical Issue?
         ↓
┌─────────────────┐
│  Tier 3:        │
│  Technical      │
│  (System Admin, │
│   Dev Team)     │
└────────┬────────┘
         │
         │ Platform Issue?
         ↓
┌─────────────────┐
│  Tier 4:        │
│  Vendor Support │
│  (Vercel,       │
│   Supabase)     │
└─────────────────┘
```

### Escalation Triggers

**Escalate from Tier 1 to Tier 2 when:**
- User cannot find answer in documentation
- Question requires system knowledge beyond docs
- User needs hands-on guidance

**Escalate from Tier 2 to Tier 3 when:**
- System error or bug suspected
- Database access required
- Permission changes needed
- Performance issue observed
- Issue affects multiple users

**Escalate from Tier 3 to Tier 4 when:**
- Vercel or Supabase platform issue confirmed
- Infrastructure failure beyond internal control
- Data recovery requires vendor assistance
- Security incident requires expert analysis

---

## Support Request Process

### Step 1: User Submits Request

**Methods:**

**Email (Preferred):**
```
TO: support@company.com
SUBJECT: [Location] Brief description of issue

Issue Details:
- What were you trying to do?
- What happened instead?
- When did this occur?
- Any error messages?
- Screenshots (if applicable)

Contact:
- Name: [Your name]
- Email: [Your email]
- Phone: [Optional]
- Urgency: [Low / Medium / High / Critical]
```

**Phone:**
- Call support line (business hours only)
- Provide: Name, location, issue description
- Support staff creates ticket on behalf of user

**In-Person:**
- Speak to supervisor or admin
- They create ticket or resolve immediately

### Step 2: Initial Triage

**Support staff (Tier 2 or 3):**

1. **Acknowledge receipt** (within 1 hour):
   ```
   Thank you for contacting support. We've received your request
   and assigned ticket #XXX. We will respond within [X hours/days]
   based on priority.
   ```

2. **Classify the issue:**
   - Assign priority (P1-P4)
   - Assign category (How-to, Data, Access, Error, Performance, Feature)
   - Assign to appropriate tier

3. **Create ticket:**
   - Use ticket tracking system (email thread, spreadsheet, or future ticketing system)
   - Log all details
   - Set due date based on SLA

### Step 3: Investigation and Resolution

**Support staff:**

1. **Investigate:**
   - Reproduce issue if possible
   - Check system logs
   - Review recent changes
   - Consult documentation

2. **Resolve or Escalate:**
   - If can resolve: Implement solution
   - If cannot resolve: Escalate to next tier with full context

3. **Communicate:**
   - Update user on progress
   - Provide workarounds if available
   - Set expectations for resolution time

### Step 4: Resolution and Follow-up

**Support staff:**

1. **Implement solution:**
   - Fix issue or guide user
   - Verify solution works
   - Document solution for future reference

2. **Close ticket:**
   - Email user with resolution
   - Ask for confirmation issue is resolved
   - Mark ticket as closed

3. **Follow-up:**
   - Check in 24 hours later
   - Ensure issue hasn't recurred
   - Collect feedback on support experience

---

## Escalation Procedures

### How to Escalate

**When escalating from Tier 2 to Tier 3:**

**Email template:**
```
TO: admin@company.com
SUBJECT: [ESCALATION] Ticket #XXX - Brief description

TICKET INFORMATION:
Ticket ID: #XXX
User: [Name, email]
Location: [Location]
Priority: P1/P2/P3/P4
Created: YYYY-MM-DD HH:MM

ISSUE SUMMARY:
[Describe what user is experiencing]

TROUBLESHOOTING ATTEMPTED:
- [Action 1]
- [Action 2]
- [Action 3]

REASON FOR ESCALATION:
[Why Tier 2 cannot resolve this]

ATTACHMENTS:
- [Screenshots, error messages, logs]

USER IMPACT:
[How is this affecting the user's work?]
```

**When escalating from Tier 3 to Tier 4:**

**Contact vendor support:**

For Vercel:
- https://vercel.com/support
- Provide: Project name, deployment URL, error logs

For Supabase:
- https://app.supabase.com/support
- Provide: Project ID, affected tables/queries, error logs

### Escalation Checklist

Before escalating, ensure you have:

- [ ] Attempted basic troubleshooting
- [ ] Gathered all relevant information (error messages, screenshots, logs)
- [ ] Documented troubleshooting steps already taken
- [ ] Confirmed user details and contact information
- [ ] Assessed priority and impact accurately
- [ ] Notified user that issue is being escalated

---

## Response Time SLAs

### Service Level Agreements

| Priority | First Response | Progress Update | Resolution Target |
|----------|----------------|-----------------|-------------------|
| **P1 - Critical** | 1 hour | Every 2 hours | 4 hours |
| **P2 - High** | 4 hours | Daily | 1 business day |
| **P3 - Medium** | 1 business day | Every 2 days | 1 week |
| **P4 - Low** | 1 week | Weekly | 1 month |

**Notes:**
- SLAs apply during business hours (8 AM - 5 PM, Mon-Fri)
- P1 incidents may require after-hours support
- Resolution target is for initial resolution (may require follow-up)

### Measuring SLA Compliance

**Monthly report should include:**

- Total tickets received
- Tickets by priority
- Tickets by category
- Average response time
- Average resolution time
- SLA compliance rate (%)
- Top 5 most common issues

---

## Common Issues and Solutions

### Issue 1: Cannot Log In

**Symptoms:**
- "Invalid credentials" error
- "Email not found" error

**Tier 2 Resolution:**

1. **Verify email address** is correct (check for typos)
2. **Check account status:**
   - Is user account active?
   - Has user been onboarded?
3. **Reset password:**
   - Guide user to "Forgot Password" link
   - Or ask admin to reset password manually

**Escalate to Tier 3 if:**
- Account exists but password reset doesn't work
- User reports they never received onboarding email

### Issue 2: Permission Denied

**Symptoms:**
- "You don't have permission" error
- Cannot access a page or feature
- Cannot see a location

**Tier 2 Resolution:**

1. **Verify user role** matches job responsibilities
2. **Check location access:**
   - Is user assigned to the location?
   - Is supervisor assigned to all locations?

**Escalate to Tier 3 if:**
- User role or location access needs to be changed
- Permission error appears to be a bug

### Issue 3: Incorrect Stock Quantity

**Symptoms:**
- Stock quantity doesn't match physical count
- Stock quantity is negative
- Recent transaction didn't update stock

**Tier 2 Resolution:**

1. **Check recent transactions** for the item/location
2. **Verify transaction was posted** (not still in draft)
3. **Guide user through reconciliation** to correct discrepancies

**Escalate to Tier 3 if:**
- Stock calculation appears incorrect (WAC bug suspected)
- Data corruption suspected
- Need to manually adjust stock (requires admin)

### Issue 4: Slow Performance

**Symptoms:**
- Pages load slowly
- API requests timeout
- UI is unresponsive

**Tier 2 Resolution:**

1. **Check user's internet connection**
2. **Try refreshing the page**
3. **Check if issue is isolated** (one user or all users?)

**Escalate to Tier 3 if:**
- Performance issue affects multiple users
- Issue persists after basic troubleshooting
- Appears to be server-side issue

### Issue 5: Transfer Not Approving

**Symptoms:**
- Transfer stuck in "Pending Approval" status
- Approval button doesn't work
- Error when approving

**Tier 2 Resolution:**

1. **Verify user has Supervisor role**
2. **Check transfer details:**
   - Is source location valid?
   - Is destination location valid?
   - Are quantities available?
3. **Try refreshing the page**

**Escalate to Tier 3 if:**
- Approval button still doesn't work
- Error message appears
- Stock availability check failing incorrectly

---

## Support Contact Information

### Internal Support Contacts

**Tier 2: First-Line Support (Supervisors)**

Kitchen Supervisor:
- Name: [TO BE FILLED]
- Email: [TO BE FILLED]
- Phone: [TO BE FILLED]
- Hours: 8 AM - 5 PM

Store Supervisor:
- Name: [TO BE FILLED]
- Email: [TO BE FILLED]
- Phone: [TO BE FILLED]
- Hours: 8 AM - 5 PM

**Tier 3: Technical Support**

System Administrator:
- Name: [TO BE FILLED]
- Email: admin@company.com
- Phone: [TO BE FILLED]
- Hours: 8 AM - 6 PM (M-F), On-call for P1

Development Team Lead:
- Name: [TO BE FILLED]
- Email: dev-lead@company.com
- Phone: [TO BE FILLED]
- Hours: Business hours, On-call for P1

### External Support Contacts

**Tier 4: Vendor Support**

Vercel Support:
- Email: support@vercel.com
- Dashboard: https://vercel.com/support
- Status: https://www.vercel-status.com
- Response: 24-48 hours

Supabase Support:
- Email: support@supabase.com
- Dashboard: https://app.supabase.com/support
- Status: https://status.supabase.com
- Response: 24-48 hours

---

## Support Ticket Template

### Ticket Tracking Spreadsheet

Use this format to track support tickets:

| Ticket ID | Date | User | Location | Priority | Category | Issue Summary | Assigned To | Status | Resolved Date |
|-----------|------|------|----------|----------|----------|---------------|-------------|--------|---------------|
| 001 | 2025-11-27 | John | Kitchen | P2 | Access | Cannot access Store location | Admin | Resolved | 2025-11-27 |
| 002 | 2025-11-28 | Jane | Store | P3 | How-to | How to approve transfer? | Supervisor | Resolved | 2025-11-28 |

### Ticket Detail Template

```markdown
## Support Ticket #XXX

**Created:** YYYY-MM-DD HH:MM
**Status:** New / In Progress / Escalated / Resolved / Closed
**Priority:** P1 / P2 / P3 / P4
**Category:** How-to / Data / Access / Error / Performance / Feature

---

### User Information

**Name:** [Full name]
**Email:** [email]
**Phone:** [phone]
**Location:** [Kitchen / Store / Central / Warehouse]
**Role:** [Operator / Supervisor / Admin]

---

### Issue Details

**Summary:** [One-line description]

**Description:**
[Detailed description of what user was trying to do and what happened]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should have happened]

**Actual Result:**
[What actually happened]

**Error Messages:**
[Any error messages displayed]

**Screenshots:**
[Attach screenshots if available]

**When did this start?**
[Date/time or "just now" or "for the past week"]

**Impact:**
[How is this affecting the user's work?]

---

### Support Activity

**Assigned To:** [Support staff name]
**First Response:** YYYY-MM-DD HH:MM
**Tier:** 1 / 2 / 3 / 4

**Troubleshooting Steps:**
- [YYYY-MM-DD HH:MM] Checked user account - active
- [YYYY-MM-DD HH:MM] Verified location access - missing Store location
- [YYYY-MM-DD HH:MM] Added Store location to user permissions

**Resolution:**
[What was done to resolve the issue]

**Root Cause:**
[Why did this issue occur?]

**Preventive Measures:**
[What can be done to prevent this in the future?]

**Resolved:** YYYY-MM-DD HH:MM
**Closed:** YYYY-MM-DD HH:MM

---

### User Feedback

**Satisfied?** Yes / No
**Comments:** [User feedback on support experience]
```

---

## Support Metrics and Reporting

### Weekly Support Report

**Generated every Monday, covering previous week:**

```markdown
## Support Report: Week of YYYY-MM-DD

### Summary

- Total tickets: XX
- Resolved: XX (XX%)
- Open: XX
- Escalated: XX

### Tickets by Priority

- P1 Critical: X (resolved: X, avg time: Xh)
- P2 High: X (resolved: X, avg time: Xh)
- P3 Medium: X (resolved: X, avg time: Xd)
- P4 Low: X (resolved: X, avg time: Xd)

### Tickets by Category

- How-to: X
- Data Issue: X
- Access Issue: X
- System Error: X
- Performance: X
- Feature Request: X

### SLA Compliance

- P1: XX% (target: 100%)
- P2: XX% (target: 95%)
- P3: XX% (target: 90%)
- P4: XX% (target: 85%)

### Top Issues

1. [Issue type] - X tickets
2. [Issue type] - X tickets
3. [Issue type] - X tickets

### Actions Needed

- [Recurring issue → Update documentation]
- [Common bug → Fix in next release]
- [Training gap → Schedule training session]
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-27 | System Administrator | Initial documentation |

---

**END OF DOCUMENT**
