---
name: servpro-post-dash-notes
description: >
  SERVPRO Bartlett/Cordova approved-note posting to Dash CRM. Executed LAST
  in the automation pipeline, only after Tristan has explicitly approved the
  draft notes produced by servpro-crm-review. Posts approved CRM notes to
  Dash and sends approved Gmail drafts. Never runs before the manual approval
  gate. Use only when Tristan has reviewed and approved all drafts.
---

# SERVPRO — Post Approved Notes to Dash CRM (Executed LAST)

> [!CAUTION]
> This skill is the **final write step** in the automation pipeline. It posts CRM notes to Dash and sends emails. It must only run **after Tristan has explicitly approved** all drafts. In the `automate-all-skills` workflow, it runs after all five preceding steps have completed: Workspace Sync & Intake → Operational Review → CRM Draft Generation → Docs & Site Validation → Tristan Approval Gate.

## Trigger

Run this skill **only** when:

- Tristan has reviewed all drafts from the CRM review.
- Tristan has explicitly approved posting via the `tristan-approval` environment gate in GitHub Actions.
- This step is invoked automatically by the `automate-all-skills` workflow **after** approval.

## Absolute Rules

- **Never post to Dash before approval.** If the approval gate has not been cleared, abort immediately.
- **Assigned-to-me filter is enforced.** Only notes for Tristan's assigned jobs are posted.
- **Never overwrite existing Dash notes** — append only.
- **Never call Pending Sale money overdue** in any note.
- **Draft-then-post flow is required.** The `servpro-crm-review` skill must have run in this workflow execution before this skill posts anything.

## Step 1 — Confirm Approval State

Verify that the `tristan-approval` environment gate was cleared in this workflow run. Abort with a clear error message if not.

## Step 2 — Post CRM Notes to Dash

For each approved job note:

- `POST /jobs/{job_id}/notes` with the approved note body.
- Confirm the HTTP response is `200` or `201` before proceeding to the next job.
- Log the posted note summary (job name, timestamp, note excerpt).

## Step 3 — Send Approved Gmail Drafts

For each approved email draft:

- Promote the Gmail draft from draft state to sent using the Gmail API.
- Log: recipient, subject, timestamp.
- Do **not** send any draft that was not explicitly included in the approval payload.

## Step 4 — Emit Completion Report

Return a summary for each job:

```
JOB: [Name + Address]
CRM Note Posted: [Yes / Error message]
Email Sent: [Yes / Not required / Error message]
Timestamp: [ISO 8601]
```

## Rollback

If any Dash post fails, log the full error, mark the job as failed in the run output, and continue with remaining jobs. Do **not** abort the entire run on a single failure. Collect all errors and report them in a final summary.
