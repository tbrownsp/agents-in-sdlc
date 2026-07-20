---
name: servpro-vertex-ai
description: >
  SERVPRO Bartlett/Cordova Vertex AI Studio and Gemini Enterprise integration.
  Uses Google Cloud Vertex AI (aiplatform.googleapis.com) for advanced job analysis,
  risk forecasting, insurance scope validation, and batch summarization across all
  active jobs. Runs in enterprise mode with Workload Identity Federation — no
  long-lived API keys required. Feeds insights back to the CRM review and ops
  review pipelines. All outputs are analysis and recommendations only — no writes
  to Dash or Google Workspace without Tristan's approval.
---

# ServPro Vertex AI Studio (Gemini Enterprise)

This skill connects the SERVPRO Bartlett/Cordova automation pipeline to **Google Cloud Vertex AI**, enabling Gemini Enterprise features: grounded search, longer context windows, data residency, and fine-tunable models. It is the **advanced analysis layer** on top of the standard `servpro-gemini-drafts` skill.

## When to use

- Weekly risk analysis: which jobs are at highest financial or schedule risk?
- Insurance scope validation: does the carrier estimate align with field conditions?
- Batch summarization: end-of-week executive summary across all open jobs.
- Supplement forecasting: which open supplements are likely to be approved based on historical patterns?
- Model evaluation: compare Gemini draft quality against previous cycles.

## Vertex AI resources used

| Resource | Purpose |
|---|---|
| `gemini-2.5-pro` on Vertex AI | High-quality analysis and supplement letters |
| `gemini-2.0-flash` on Vertex AI | Fast batch summaries |
| Vertex AI Grounding (Google Search) | Verify code, material costs, carrier rate guides |
| BigQuery (optional) | Store job metrics for trend analysis |

## Required secrets

- `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON` — Service account with Vertex AI User role
- `GOOGLE_CLOUD_PROJECT` — GCP project ID
- `GOOGLE_CLOUD_LOCATION` — Region (e.g., `us-central1`)

## Authentication

Uses **Workload Identity Federation** (OIDC) via `id-token: write` workflow permission — no long-lived credentials are stored. The service account must have the `roles/aiplatform.user` IAM role on `$GOOGLE_CLOUD_PROJECT`.

## Policy

- All analysis outputs are advisory — they inform Tristan's decisions but do not auto-apply changes.
- No PII is sent to Vertex AI beyond what is necessary for each analysis prompt.
- All Vertex AI API calls are logged (model, tokens used, timestamp) for cost tracking.
