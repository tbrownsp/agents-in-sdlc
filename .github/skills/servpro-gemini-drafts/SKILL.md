---
name: servpro-gemini-drafts
description: >
  SERVPRO Bartlett/Cordova Gemini AI-powered draft generation for CRM notes,
  customer emails, adjuster follow-ups, crew messages, and supplement summaries.
  Calls the Gemini API (gemini-2.0-flash or gemini-2.5-pro) to convert raw job
  data and voice-note inputs into polished, copy-paste-ready drafts in Tristan's
  voice. All outputs are drafts for Tristan's review — nothing is sent or posted
  until explicitly approved. Use alongside or after servpro-crm-review.
---

# ServPro Gemini Draft Generation

This skill uses the **Gemini API** to convert structured job data, raw voice notes, and operational context into polished drafts. It is the AI layer on top of all other ServPro skills — it does not pull data itself, but processes the outputs of `servpro-crm-review`, `servpro-ops-review`, and `servpro-pipeline-intake` through Gemini to produce publication-ready text.

## When to use

- After `servpro-crm-review` generates the structured per-job breakdown — to convert those breakdowns into finalized CRM notes in Tristan's voice.
- When Tristan provides rough voice notes or bullet points — to convert them into calm, professional customer or adjuster communication.
- Before opening a PR or sending communication — to quality-check tone and completeness.
- For supplement summaries: given a line-item discrepancy list, produce a professional adjuster letter.

## Gemini models used

| Use case | Model |
|---|---|
| CRM note drafts, email drafts | `gemini-2.0-flash` (fast, cost-efficient) |
| Supplement letters, complex analysis | `gemini-2.5-pro` (highest quality) |
| Batch job summaries | `gemini-2.0-flash` |

## Required secrets

- `GEMINI_API_KEY` — Google AI Studio API key (or Vertex AI API key for enterprise)
- `GOOGLE_CLOUD_PROJECT` — GCP project ID (required for Vertex AI / Gemini Enterprise)
- `GOOGLE_CLOUD_LOCATION` — GCP region (e.g., `us-central1`)

## Gemini Enterprise (Gemini for Google Workspace)

When `GEMINI_ENTERPRISE=true` is set, this skill routes requests through **Vertex AI** (`aiplatform.googleapis.com`) using the service account credentials, enabling Gemini Enterprise features: grounding with Google Search, longer context windows, and data residency guarantees. OIDC-based credential exchange (`id-token: write` in the workflow permissions) is used — no long-lived API key required in enterprise mode.

## Policy

- **All outputs are drafts.** No CRM note, email, Chat message, or document is posted until Tristan explicitly reviews and approves via the `tristan-approval` environment gate.
- Gemini is given only the minimum context needed for each draft — no PII is sent beyond what is necessary.
- The model is explicitly instructed to write in Tristan's voice: first-person PM, direct, professional, accountable, not robotic.
- The model is explicitly instructed **never** to describe Pending Sale money as overdue.
