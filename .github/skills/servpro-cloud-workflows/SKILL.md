---
name: servpro-cloud-workflows
description: >
  SERVPRO Bartlett/Cordova Google Cloud Workflows orchestration for multi-step
  automation. Deploys and executes Cloud Workflows definitions that chain Google
  Workspace API calls, Dash CRM queries, Gemini AI draft generation, and Sheets
  updates into durable, retryable, event-driven pipelines. Handles Cloud Pub/Sub
  triggers, Cloud Scheduler cron jobs, and Cloud Run function invocations.
  Use to orchestrate long-running or event-triggered automations beyond what
  GitHub Actions can reliably run within a single job timeout.
---

# ServPro Google Cloud Workflows Orchestration

This skill manages the **Google Cloud infrastructure layer** for the SERVPRO automation stack. While the GitHub Actions workflow (`automate-all-skills.yml`) orchestrates the daily scheduled run, Cloud Workflows handles event-driven and long-running processes that benefit from Google Cloud's durable execution engine, retry logic, and Pub/Sub integration.

## When to use

- Deploying or updating Cloud Workflows YAML definitions.
- Triggering a workflow execution from a Cloud Pub/Sub event (e.g., a new Gmail message arrives).
- Scheduling Cloud Scheduler jobs that invoke specific sub-workflows on a cron schedule independent of GitHub Actions.
- Monitoring active workflow executions and surfacing failures.
- Deploying Cloud Run functions that back the Workspace API integration (OAuth token exchange, webhook receivers).

## Cloud resources managed

| Resource | Purpose |
|---|---|
| Cloud Workflows | Durable multi-step API orchestration with retry and error handling |
| Cloud Scheduler | Cron-triggered workflow executions (backup/complement to GitHub Actions schedule) |
| Cloud Pub/Sub | Event-driven triggers (new Gmail lead, new Chat message, new Drive upload) |
| Cloud Run (Functions) | Stateless API handlers for webhook ingestion and token exchange |
| Cloud Logging | Centralized execution logs for all automation steps |
| Secret Manager | Secure storage for Dash API tokens, Gemini keys, service account JSON |

## Required secrets

- `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON` — Service account with Cloud Workflows + Scheduler + Pub/Sub + Run roles
- `GOOGLE_CLOUD_PROJECT` — GCP project ID
- `GOOGLE_CLOUD_LOCATION` — Region (e.g., `us-central1`)

## Policy

- Workflow definitions are deployed from `.github/skills/servpro-cloud-workflows/workflows/` (YAML files).
- No workflow is executed in production until Tristan approves the deployment via the `tristan-approval` gate.
- All Cloud Run functions are deployed with minimum necessary IAM permissions (least-privilege).
- Secret Manager is used for all credentials — no secrets in workflow YAML files.
