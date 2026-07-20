---
name: servpro-google-chat
description: >
  SERVPRO Bartlett/Cordova Google Chat lead monitoring and crew coordination.
  Scans Google Chat spaces for new leads, customer inquiries, and crew updates.
  Routes new leads into the pipeline-intake flow, drafts crew coordination
  messages for Tristan's approval, and flags urgent items for same-day response.
  All messages are draft-only until Tristan explicitly approves sending.
---

# ServPro Google Chat Automation

This skill monitors Google Chat spaces for restoration-relevant activity and surfaces actionable items. It is the **intake source** for leads arriving via Chat, and the **coordination channel** for crew communication threads. No messages are sent without Tristan's explicit approval.

## When to use

- Whenever a new lead or inquiry arrives via Google Chat.
- During the daily triage to check for unanswered crew or customer threads.
- As part of the workspace-sync or pipeline-intake flow.

## Chat spaces monitored

| Space | Purpose |
|---|---|
| New Leads / Referrals | Incoming job inquiries from agents, adjusters, and referral partners |
| Crew Coordination | Internal crew schedule and site-status updates |
| Customer Direct Messages | Direct Chat threads from customers (if any) |
| Management / Team | Internal SERVPRO team updates and escalations |

## Required secrets

- `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON` — Service account key with Chat scope
- `GOOGLE_IMPERSONATED_USER` — Tristan's Google Workspace email
- `GOOGLE_CHAT_LEADS_SPACE_ID` — Space ID for the new-leads Chat space
- `GOOGLE_CHAT_CREW_SPACE_ID` — Space ID for the crew coordination space

## Policy

- **Draft-only.** No Chat messages are sent until Tristan reviews and approves.
- New leads detected in Chat are immediately routed to `servpro-pipeline-intake`.
- Crew messages flagged as unanswered for 4+ hours are escalated as stale alerts.
- Personal or off-topic threads are ignored.
