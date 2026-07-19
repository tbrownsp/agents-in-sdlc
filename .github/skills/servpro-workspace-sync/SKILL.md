---
name: servpro-workspace-sync
description: >
  SERVPRO Bartlett/Cordova Google Workspace cross-posting and alignment for Tristan Brown.
  Uses Dash CRM updates to sync job details across Gmail, Calendar, Tasks, Contacts, Drive,
  Docs, Sheets, Forms, and Photos. Reviews Gmail label flow (A/R, In Progress, Pending Sales,
  General) and Drive job structure (Tristan's Active Jobs). Produces a job-by-job action sheet
  with drafted updates — no final posting or sending without Tristan's approval. Use when
  Tristan asks to sync apps, cross-post info, update the workspace, or align Google tools
  with Dash.
---

# SERVPRO — Google Workspace Cross-Posting + Alignment

Use Dash CRM updates (or best available data when Dash is unavailable — flag all Dash verification items) to sync required details across every Google Workspace tool Tristan uses.

## Trigger

Run this skill when:

- Tristan asks to "sync apps," "cross-post," "update the workspace," or "align Google tools."
- A Dash update has occurred that needs to be reflected across Gmail, Calendar, Drive, etc.
- The periodic workspace alignment review is due.

## Step 1 — Review Gmail Label Flow

For each open job, check and report:

- Is the Gmail thread labeled correctly?
  - **Pending Sale** — awaiting authorization, approval, deposit, or contract.
  - **Work in Progress** — active production.
  - **A/R** — invoice issued, payment pending.
  - **General** — info not tied to an active or closed job.
- Are there threads that need a label correction?
- Are there emails that need a response or follow-up draft?

**Rules:**
- Preserve existing label logic.
- Never create duplicate Gmail labels.
- Do not send emails; draft only.

## Step 2 — Review Calendar Quality

For each open job, verify or draft calendar event details including:

- Job name and job number (if known)
- Full site address
- Color code (yellow = out of office, red = in office, blue/berry = crew/sub on site, orange = virtual)
- Next milestone or scheduled production activity
- Customer contact name and phone
- Special access or site instructions
- Claim context (if insurance)

Also confirm or flag:

- Monday morning 2-hour office block is present.
- Every Friday is blocked as a full office day.
- Thursday 1-hour sync with Elizabeth is scheduled after the morning meeting (2 sessions if load is heavy).
- Morning meetings, A&R Regional meetings, and 2:00–3:00 PM mitigation meetings are confirmed on the calendar (as available).

**Rules:**
- Never add invitees unless explicitly requested.
- Tristan is the only invitee by default.

## Step 3 — Review Task List Status

For each open job:

- Are all open tasks captured with due dates?
- Are any tasks overdue?
- Are follow-up tasks created for stale jobs (48+ hours without communication)?

## Step 4 — Review Contact Completeness

For each active customer, adjuster, vendor, or sub:

- Is the contact record complete? (name, phone, email, company/role, job association)
- Flag any contact missing critical fields.

## Step 5 — Review Drive Folder Completeness

For each open job under **Tristan's Active Jobs**, check for the following documents and flag what is missing:

| Required | Recon | Insurance | Water/Mold/Fire | Contents | Duct |
|---|---|---|---|---|---|
| Contract | ✓ | ✓ | ✓ | ✓ | ✓ |
| Work authorization | ✓ | ✓ | ✓ | ✓ | ✓ |
| Material selection form | ✓ | ✓ | — | — | — |
| Budget | ✓ | ✓ | ✓ | ✓ | ✓ |
| Change order(s) | As needed | As needed | As needed | — | — |
| Punch list | As needed | As needed | — | — | — |
| MSF | ✓ | — | — | — | — |
| Layout | As needed | As needed | — | — | — |
| COS | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lien waiver | ✓ | ✓ | ✓ | ✓ | ✓ |
| Carrier estimate | — | ✓ | ✓ | — | — |
| Supplement requests | — | As needed | As needed | — | — |
| ITEL report | — | As needed | — | — | — |
| Mold protocol | — | — | Mold only | — | — |
| Drying logs | — | — | Water only | — | — |
| Contents inventory | — | — | — | ✓ | — |
| Duct inspection docs | — | — | — | — | ✓ |
| Final photos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Subcontractor invoices | As needed | As needed | As needed | — | — |

## Step 6 — Photo Handling

For photos arriving in Google Photos or shared drives:

1. Match the photo location/address to the correct open job.
2. Place photos in the correct Drive job folder (under Tristan's Active Jobs → [Job Name] → Photos).
3. Flag photos ready for upload into Dash CRM.
4. Do not delete or reorganize photos without explicit instruction.

## Step 7 — Form / Template Readiness

For each open job, identify any standard forms or templates that should be pre-filled with known information:

- Customer name, address, phone, email
- Job type, cause of loss, job number
- Insurance carrier, adjuster, claim number
- Contract amount, material selections (if confirmed)

Flag which templates are blank, which are partially filled, and which are complete.

## Output Format

Return for each job:

```
JOB: [Name + Address]
Stage: [Status]

Gmail:
  Label status: [Correct / Needs correction → recommended label]
  Pending response: [Yes / No — thread summary if yes]

Calendar:
  Event quality: [Complete / Missing → list gaps]
  Protected blocks confirmed: [Monday 2hr office / Friday full day / Thursday Elizabeth]

Tasks:
  Open tasks: [Count + overdue flag]
  Follow-up task needed: [Yes / No]

Contacts:
  Completeness: [Complete / Missing → list gaps]

Drive:
  Missing docs: [List or "None"]
  Photos: [Ready for Dash upload / None pending]

Forms:
  Templates to pre-fill: [List or "None"]

Action Sheet:
  [Bulleted list of exactly what to update, in which system, and the drafted content]

Risk: Low / Med / High
```

## Absolute Rules

- Do not post, send, or apply any update until Tristan explicitly approves.
- Do not create random duplicate Gmail labels or Drive folders.
- Do not add calendar invitees unless explicitly requested.
- Preserve existing folder structure under Tristan's Active Jobs.
- Only touch Tristan's open jobs — never touch closed jobs or jobs not assigned to Tristan.
