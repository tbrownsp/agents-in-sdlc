---
name: servpro-pipeline-intake
description: >
  SERVPRO Bartlett/Cordova proactive pipeline management and new-lead intake engine for
  Tristan Brown. When a new lead arrives via Gmail or Google Chat, creates a full job setup
  package, drafts initial outreach and missing-info follow-ups, and enforces the stage-gate
  checklist before any job moves to Work in Progress. Also generates customer information
  forms and gets ahead of issues before they become problems. Use when Tristan receives a
  new lead, needs to set up a new job file, or wants to review pipeline readiness and
  stage-gate compliance.
---

# SERVPRO — Proactive Pipeline + Intake Engine

Act ahead of issues. For every new lead from Gmail or Google Chat, create a new job setup package and intake follow-up drafts. For existing Pending Sale jobs, enforce stage-gate rules and push them toward WIP with everything in place.

## Trigger

Run this skill when:

- A new lead or inquiry arrives via Gmail or Google Chat.
- Tristan asks to "set up a new job," "intake a new customer," or "check pipeline readiness."
- A Pending Sale needs review to determine what is blocking the move to WIP.
- Tristan wants to get ahead of issues on an active or incoming job.

## Step 1 — Capture Required Intake Fields

For every new lead, immediately identify and collect (or flag as missing):

| Field | Required |
|---|---|
| Customer name | ✓ |
| Job address | ✓ |
| Access instructions | ✓ |
| Phone number | ✓ |
| Email address | ✓ |
| Cause of loss | ✓ |
| Insurance carrier | If insurance |
| Insurance claim number | If insurance |
| Adjuster name and contact | If insurance |
| Policy number | If insurance |
| Date of loss | ✓ |

Draft a missing-info follow-up for any field not yet captured.

## Step 2 — New Job Setup Package

When a new lead is confirmed, produce a complete new job setup checklist:

### Dash CRM Setup

- [ ] Create new job record in Dash with all intake fields.
- [ ] Set stage to Pending Sale.
- [ ] Attach insurance info if applicable.
- [ ] Log initial CRM note (cause of loss, source of lead, first contact date/time).
- [ ] Set 48-hour follow-up task.

### Drive Setup

- [ ] Create new job folder under Tristan's Active Jobs: `[Customer Last Name] - [Job Address] - [Job Type]`
- [ ] Create subfolders: Contracts / Estimates / Photos / Correspondence / Closeout
- [ ] Stage blank templates in the Contracts folder: contract, work authorization, material selection form, budget.
- [ ] For insurance jobs: add carrier estimate placeholder and supplement request template.

### Gmail Setup

- [ ] Label incoming email thread as **Pending Sale**.
- [ ] Create contact record for customer with name, phone, email, job address.
- [ ] Draft initial outreach email (Step 3 below).

### Calendar Setup

- [ ] Draft calendar event for initial site visit or estimate appointment if date is known.
- [ ] Include job name, address, customer contact, and claim context.
- [ ] Color code: blue/berry if crew on site, orange if virtual, red if office appointment.

## Step 3 — Initial Customer Outreach Draft

Draft an email in Tristan's voice:

- Acknowledge the inquiry or job.
- Confirm you have their information and are getting to work for them.
- State the next step and expected timing (estimate, site visit, call).
- Include a warm, professional close that sets expectations without overpromising.

If intake information is missing, include a specific ask for the missing fields without sounding like a form — write it naturally.

## Step 4 — Stage-Gate Checklist (Before Moving Any Job to WIP)

No job moves to Work in Progress without all of the following confirmed:

| Gate | Required |
|---|---|
| Signed contract | ✓ |
| Collected deposit or confirmed financial path | ✓ |
| Material selections confirmed | ✓ |
| Estimate approved (insurance) or price accepted (retail) | ✓ |
| Access instructions documented | ✓ |
| Crew/sub scheduled with confirmed start date | ✓ |
| Job folder complete with intake docs | ✓ |

**Exception — Drywall-only simple jobs:** May proceed with an adjusted requirement set. Flag clearly as a drywall exception in the CRM note and checklist.

For each gate that is not cleared, produce:

- A specific draft communication to the party who needs to provide it (customer, carrier, adjuster).
- A recommended deadline.
- A CRM note draft documenting the hold.

## Step 5 — Customer Information Forms

For each new or early-stage job, identify and prepare the appropriate customer information form for what the customer is going through:

- **Water loss:** Explain the drying process, equipment placement, daily check-in expectations, and timeline.
- **Mold:** Explain the remediation process, containment, air quality testing, and clearance steps.
- **Fire:** Explain pack-out, cleaning scope, structural scope, and the insurance process timeline.
- **Contents:** Explain inventory, cleaning, storage, and return process.
- **Duct:** Explain the cleaning scope, before/after documentation, and timeline.
- **Recon/Rebuild:** Explain material selection, production schedule, change order process, and payment milestones.

Pre-fill all known customer and job details into the form. Flag any fields that still need information.

## Step 6 — Proactive Issue Alerts

For each open Pending Sale or early WIP job, flag any of the following risks:

- No estimate submitted within 5 business days of initial contact.
- No contract signed within 5 business days of estimate delivery.
- No deposit collected before production start.
- Insurance job moving to production without carrier approval or scope agreement.
- Customer not reachable for 48+ hours during active intake.
- Missing access instructions before scheduled crew mobilization.

For each flag, produce a specific recommended action and draft communication.

## Output Format

For each new lead or Pending Sale job:

```
JOB: [Name + Address]
Stage: [Pending Sale / New Lead]
Lead Source: [Gmail / Google Chat / Other]
Date of First Contact: [Date/time]

Intake Status:
  Complete fields: [List]
  Missing fields: [List]

New Job Setup Checklist:
  Dash: [Done / Pending items]
  Drive: [Done / Pending items]
  Gmail: [Done / Pending items]
  Calendar: [Done / Pending items]

Stage-Gate Status:
  [Gate name]: [Cleared / Blocked → reason]

Customer Outreach Draft:
  To: [Customer name]
  Subject: [Subject line]
  [Body]

Missing-Info Follow-Up Draft (if needed):
  To: [Customer name]
  Subject: [Subject line]
  [Body]

Customer Info Form: [Job type form — pre-filled with known details]

Proactive Alerts: [List or "None"]

Risk: Low / Med / High
Next Action: [Exact action + owner + due date]
```

## Absolute Rules

- Do not move any job to WIP without all stage-gate requirements cleared (or a documented drywall exception).
- Do not send emails until Tristan explicitly approves.
- Do not create random duplicate Drive folders or Gmail labels.
- Only create intake packages for jobs and leads directed at Tristan.
- Draft everything; finalize nothing without approval.
