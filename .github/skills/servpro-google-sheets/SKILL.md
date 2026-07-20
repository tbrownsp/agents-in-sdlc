---
name: servpro-google-sheets
description: >
  SERVPRO Bartlett/Cordova Google Sheets financial tracker and job pipeline dashboard.
  Maintains the Weekly Management Accountability Tracker, per-job A/R aging summary,
  collections dashboard, and crew production log in Google Sheets. Auto-populates
  rows from Dash CRM data, highlights stale or overdue items, and exports PDF
  snapshots to Drive. All writes are draft-only until Tristan approves.
---

# ServPro Google Sheets Automation

This skill maintains all Google Sheets-based financial and operational tracking for SERVPRO Bartlett/Cordova. Sheets serves as the **reporting and visibility layer** — Dash CRM remains the source of truth. No Sheets data overwrites Dash.

## When to use

- Weekly tracker update (every Friday, and on demand).
- After any financial change (new invoice, payment received, supplement approved).
- When generating the by-customer money summary.
- As part of the Monday/Wednesday/Friday ops review (called from `servpro-ops-review`).

## Sheets managed by this skill

| Sheet | Purpose |
|---|---|
| Weekly Management Accountability Tracker | Per-job KPIs, stage, blocker, A/R status — PDF exported to Drive each Friday |
| A/R Aging Summary | Days outstanding per invoice, payer type, escalation flag |
| Collections Dashboard | Per-job collected / invoiced / outstanding with % collected |
| Crew Production Log | Hours on site per crew per job, linked to Calendar events |
| Job Pipeline Board | All active jobs by stage, ordered by risk |

## Required secrets

- `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON` — Service account key with Sheets + Drive scope
- `GOOGLE_IMPERSONATED_USER` — Tristan's Google Workspace email
- `GDRIVE_ROOT_FOLDER_ID` — Root "Tristan's Active Jobs" Drive folder
- `GSHEETS_TRACKER_ID` — Spreadsheet ID for the Weekly Management Accountability Tracker
- `DASH_API_BASE_URL` — Dash CRM base URL
- `DASH_API_TOKEN` — Dash CRM API token

## Policy

- **Read from Dash; write to Sheets.** Never reverse — Sheets is the view, not the source of truth.
- All rows added or updated are logged and presented as a draft change set.
- PDF exports go to the matching Drive job folder. No file is moved without approval.
- Overdue A/R items are flagged with conditional formatting, not with "overdue" language for Pending Sale jobs.
