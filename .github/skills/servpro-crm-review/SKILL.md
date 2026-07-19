---
name: servpro-crm-review
description: >
  SERVPRO Bartlett/Cordova Dash CRM Truth Review for Tristan Brown. Runs every 48 hours.
  Pulls all open jobs, produces per-job status breakdowns, identifies missing info and docs,
  flags stale communication, and generates CRM note drafts and Gmail follow-up drafts ready
  for Tristan's review. Use whenever Tristan asks for a CRM review, daily triage, 48-hour
  check, or stale job alert.
---

# SERVPRO — Dash CRM Truth Review (Every 48 Hours)

Dash CRM / Next Gear CRM is the source of truth. Review only Tristan's open jobs and only messages/tasks directed to him.

## Trigger

Run this skill when:

- Tristan asks for a "CRM review," "daily triage," "48-hour check," or "stale jobs."
- 48 hours have passed since the last CRM review.
- A new job note, email, or task arrives that needs to be reflected in Dash.

## Step 1 — Pull Open Jobs

For each open job, gather from Dash (or from available Gmail, Drive, Calendar, and uploaded files when Dash access is unavailable — flag all Dash verification items):

- Job name, job number, job type (recon, mold, fire, water, contents, duct)
- Current stage (Pending Sale, Pre-Production, WIP, Invoice Pending, A/R, Closeout)
- Customer name, address, phone, email
- Insurance carrier, adjuster name and contact, claim number (if insurance)
- Last customer contact date/time
- Last internal CRM note date/time
- Open tasks and their due dates

## Step 2 — Flag Missing Critical Intake Info

For each job, identify any missing required intake fields:

- Customer name
- Job address
- Access instructions
- Phone number
- Email address
- Cause of loss
- Insurance carrier and claim number (insurance jobs only)

## Step 3 — Flag Missing Required Docs by Job Type

| Job Type | Required Documents |
|---|---|
| All jobs | Contract, work authorization, material selection form, budget, COS, lien waiver |
| Recon | + MSF, change order, punch list, layout (as needed) |
| Insurance | + Carrier estimate, supplement requests, ITEL, claim/carrier correspondence |
| Mold | + Mold protocol, clearance documentation |
| Water | + Moisture readings, drying logs, equipment placement records |
| Fire | + Scope of loss, smoke/char documentation |
| Contents | + Contents inventory/pack-out list |
| Duct | + Pre/post duct inspection documentation |

## Step 4 — Identify Blockers and Next Actions

For each job, state:

- What is blocking the job from advancing to the next stage.
- The exact next action required.
- Who owns the next action (Tristan, customer, adjuster, vendor, sub, carrier, mortgage).
- When the next action is due or what event triggers it.

## Step 5 — 48-Hour Stale Alert List

Flag every job where:

- No customer communication in 48+ hours.
- No CRM note/notation in 48+ hours.

For each stale job, note: last touchpoint date, type of last touchpoint, and recommended follow-up action.

## Step 6 — Draft CRM Notes

For every open job, write a CRM-ready note following this formula:

1. Current status — what is true now.
2. Recent action — who was contacted or what changed.
3. Blocker / dependency — approval, signature, money, schedule, materials, vendor, documentation, carrier, mortgage, etc.
4. Next action — exactly what happens next and who owns it.
5. Follow-up date or trigger — when to revisit or what event releases the next step.

**Formatting rules:**
- Write in first-person PM language: "I followed up," "Customer advised," "I am waiting on," "Next step is."
- Never write reviewer language such as "review/update status note" or "needs updated status note."
- For Pending Sale: explain the approval/decision/deposit/contract blocker — never say money is overdue.
- For WIP: identify production movement and next scheduled work.
- For A/R: identify invoice/payment status, payer, next collection action, and supporting paperwork needs.
- Each note must be specific to this job — never copy/paste the same language across multiple jobs.

## Step 7 — Draft Gmail Follow-Up Emails

For each job requiring a customer, adjuster, or vendor follow-up, draft an email:

- Written in Tristan's voice: direct, professional, accountable, and calm.
- Includes clear next steps, dates, blockers, and ownership.
- Never sends — drafts only until Tristan explicitly approves.

## Output Format

Return for each job:

```
JOB: [Name + Address]
Stage: [Status] | Owner: Tristan Brown
Last Touchpoint: [Date/time + type]
Stale Alert: [Yes / No — days since last contact]

Missing Intake: [List or "None"]
Missing Docs: [List or "None"]
Blocker: [Description or "None"]
Next Action: [Exact action + owner + due date/trigger]

CRM Note Draft:
[Paste-ready note]

Email Draft (if needed):
To: [Name / role]
Subject: [Subject line]
[Body]

Risk: Low / Med / High
```

## Absolute Rules

- Do not touch closed jobs unless Tristan explicitly instructs it.
- Do not send any email until Tristan explicitly approves.
- Do not overwrite Dash status based only on Google Workspace data.
- Never call Pending Sale money overdue.
- Produce drafts only — all finals require Tristan's explicit approval.
