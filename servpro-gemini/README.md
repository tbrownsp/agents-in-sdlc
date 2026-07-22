# servpro-gemini

Node.js workflow runner for SERVPRO Bartlett/Cordova — powered by the Gemini API.

All outputs are **DRAFT ONLY** until Tristan explicitly approves them. Nothing is posted to Dash CRM or sent via Gmail without the approval gate.

## Prerequisites

- Node.js 20+
- A Google AI Studio API key **or** a Google Cloud project with Vertex AI enabled
- Dash CRM API credentials
- Google Workspace service account (for Gmail, Calendar, Drive, Sheets, Chat)

## Setup

```bash
cd servpro-gemini
npm install
cp .env.example .env   # fill in your credentials
```

### `.env` file

```
# Gemini
GEMINI_API_KEY=your-google-ai-studio-key
# GEMINI_ENTERPRISE=true          # uncomment to use Vertex AI instead
# GOOGLE_CLOUD_PROJECT=your-proj
# GOOGLE_CLOUD_LOCATION=us-central1
# GEMINI_MODEL_FAST=gemini-2.0-flash
# GEMINI_MODEL_PRO=gemini-2.5-pro

# Dash CRM
DASH_API_BASE_URL=https://servpro.ngsapps.net/api
DASH_API_TOKEN=your-dash-token

# Google Workspace
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_IMPERSONATED_USER=tristan@yourdomain.com

# Approval gate (required for post-dash-notes)
# TRISTAN_APPROVAL_TOKEN=set-this-only-after-reviewing-all-drafts

# Google Sheets
# SERVPRO_SPREADSHEET_ID=your-spreadsheet-id

# Google Chat space names (format: spaces/XXXXXXX)
# CHAT_SPACE_NEW_LEADS=spaces/...
# CHAT_SPACE_CREW=spaces/...
# CHAT_SPACE_CUSTOMER_DMS=spaces/...
# CHAT_SPACE_MANAGEMENT=spaces/...
```

## Usage

```bash
# CRM Review — pull all open jobs, generate per-job note + email drafts
node index.js crm-review

# Ops Review — Mon/Wed/Fri cadence (auto-detects today's day)
node index.js ops-review

# Pipeline Intake — process a new lead (prompts interactively)
node index.js pipeline-intake

# Gemini Drafts — generate a single draft interactively
node index.js gemini-drafts crm-note
node index.js gemini-drafts email
node index.js gemini-drafts adjuster
node index.js gemini-drafts voice
node index.js gemini-drafts supplement

# Workspace Sync — review + apply Gmail labels (dry run by default)
node index.js workspace-sync
node index.js workspace-sync --apply-labels   # actually applies labels

# Google Sheets — update trackers
node index.js google-sheets tracker
node index.js google-sheets ar
node index.js google-sheets collections
node index.js google-sheets money-summary

# Google Chat — scan for leads and crew updates
node index.js google-chat

# Vertex AI — advanced analysis
node index.js vertex-ai risk
node index.js vertex-ai summary
node index.js vertex-ai scope

# Post Approved Notes — LAST STEP, requires TRISTAN_APPROVAL_TOKEN
TRISTAN_APPROVAL_TOKEN=approved APPROVED_NOTES_JSON='[...]' node index.js post-dash-notes
```

## Workflow order

The standard daily automation pipeline runs in this order:

1. `crm-review` — pull jobs, generate drafts
2. `ops-review` — ops cadence output
3. `google-chat` — triage new leads
4. `workspace-sync` — align Google Workspace
5. `google-sheets` — update trackers
6. **Tristan reviews and approves all drafts**
7. `post-dash-notes` — post approved notes to Dash (requires `TRISTAN_APPROVAL_TOKEN`)

## Policy

- **All outputs are drafts.** The code prints drafts to the console and stores Gmail drafts — nothing is sent or posted to Dash until Step 7.
- **Approval gate is enforced.** `post-dash-notes` will throw if `TRISTAN_APPROVAL_TOKEN` is not set.
- **Dash notes are append-only.** Existing notes are never overwritten.
- **Pending Sale money is never described as overdue.**
- **Assigned-to-me filter.** Only jobs assigned to Tristan are processed.
