// index.js
// SERVPRO Bartlett/Cordova — Gemini Workflow Runner
// Usage: node index.js <workflow> [options]
//
// Workflows:
//   crm-review          Run the full CRM truth review + draft generation
//   ops-review          Run today's Mon/Wed/Fri ops cadence
//   pipeline-intake     Intake a new lead (prompts for details)
//   gemini-drafts       Generate a draft interactively (crm-note | email | adjuster | voice | supplement)
//   workspace-sync      Review and sync Dash data across Google Workspace
//   google-sheets       Update Sheets trackers (tracker | ar | collections | money-summary)
//   google-chat         Scan Chat spaces for leads and crew updates
//   vertex-ai           Run Vertex AI analysis (risk | scope | forecast | summary)
//   post-dash-notes     Post approved notes to Dash (requires TRISTAN_APPROVAL_TOKEN)

import 'dotenv/config';
import { createInterface } from 'readline';

// ─── Workflow imports ─────────────────────────────────────────────────────────

import { runCRMReview }              from './workflows/crm-review.js';
import { runOpsReview }              from './workflows/ops-review.js';
import { intakeNewLead, checkStageGate } from './workflows/pipeline-intake.js';
import {
  draftCRMNote, draftCustomerEmail, draftAdjusterLetter,
  draftFromVoiceNote, draftSupplementLetter,
}                                    from './workflows/gemini-drafts.js';
import { runWorkspaceSync }          from './workflows/workspace-sync.js';
import {
  updateWeeklyTracker, updateARAgingSummary,
  updateCollectionsDashboard, generateMoneySummary,
}                                    from './workflows/google-sheets.js';
import { runChatTriage }             from './workflows/google-chat.js';
import {
  runRiskAnalysis, generateWeeklyExecutiveSummary,
  validateInsuranceScope, forecastSupplementApprovals,
}                                    from './workflows/vertex-ai.js';
import { postAllApprovedNotes }      from './workflows/post-dash-notes.js';

// ─── CLI helpers ──────────────────────────────────────────────────────────────

function usage() {
  console.log(`
SERVPRO Gemini Workflow Runner
Usage: node index.js <workflow> [sub-command]

Workflows:
  crm-review                 Full CRM review + per-job Gemini draft generation
  ops-review                 Mon/Wed/Fri ops cadence (runs correct day automatically)
  pipeline-intake            Intake a new lead (reads from LEAD_* env vars or stdin)
  gemini-drafts <type>       Generate a single draft:
                               crm-note | email | adjuster | voice | supplement
  workspace-sync             Sync Dash data across Google Workspace
  google-sheets <sub>        Update Sheets trackers:
                               tracker | ar | collections | money-summary
  google-chat                Scan Chat spaces for leads and crew updates
  vertex-ai <sub>            Vertex AI analysis:
                               risk | summary | scope | forecast
  post-dash-notes            Post approved notes to Dash (requires TRISTAN_APPROVAL_TOKEN)

Environment variables:
  GEMINI_API_KEY             Google AI Studio API key
  GEMINI_ENTERPRISE          Set to 'true' to use Vertex AI instead of AI Studio
  GOOGLE_CLOUD_PROJECT       GCP project ID (Vertex AI mode)
  GOOGLE_CLOUD_LOCATION      GCP region (default: us-central1)
  DASH_API_BASE_URL          Dash CRM base URL
  DASH_API_TOKEN             Dash CRM API token
  GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON  Service account JSON for Workspace APIs
  GOOGLE_IMPERSONATED_USER   Tristan's Google Workspace email
  TRISTAN_APPROVAL_TOKEN     Required to post notes to Dash
  SERVPRO_SPREADSHEET_ID     Google Sheets spreadsheet ID
`);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

// ─── Route ────────────────────────────────────────────────────────────────────

async function main() {
  const [,, workflow, subCommand] = process.argv;

  if (!workflow || workflow === '--help' || workflow === '-h') {
    usage();
    process.exit(0);
  }

  try {
    switch (workflow) {

      // ── CRM Review ──────────────────────────────────────────────────────────
      case 'crm-review': {
        const report = await runCRMReview();
        console.log('\nFull report stored in memory — pass to post-dash-notes after approval.');
        break;
      }

      // ── Ops Review ──────────────────────────────────────────────────────────
      case 'ops-review': {
        await runOpsReview();
        break;
      }

      // ── Pipeline Intake ──────────────────────────────────────────────────────
      case 'pipeline-intake': {
        // Read from env vars or prompt interactively.
        const lead = {
          customerName: process.env.LEAD_CUSTOMER_NAME || await ask('Customer name: '),
          address:      process.env.LEAD_ADDRESS        || await ask('Address: '),
          phone:        process.env.LEAD_PHONE           || await ask('Phone: '),
          email:        process.env.LEAD_EMAIL           || await ask('Email (optional): ') || undefined,
          causeOfLoss:  process.env.LEAD_CAUSE           || await ask('Cause of loss: '),
          source:       process.env.LEAD_SOURCE          || await ask('Lead source: '),
          notes:        process.env.LEAD_NOTES           || await ask('Additional notes: '),
        };
        await intakeNewLead(lead);
        break;
      }

      // ── Gemini Drafts ────────────────────────────────────────────────────────
      case 'gemini-drafts': {
        const draftType = subCommand || await ask('Draft type (crm-note|email|adjuster|voice|supplement): ');

        if (draftType === 'crm-note') {
          const draft = await draftCRMNote({
            jobName:         await ask('Job name: '),
            stage:           await ask('Stage: '),
            lastContact:     await ask('Last customer contact: '),
            blocker:         await ask('Current blocker: '),
            nextAction:      await ask('Next action: '),
            followUpTrigger: await ask('Follow-up date or trigger: '),
          });
          console.log('\n=== DRAFT CRM NOTE ===\n' + draft);

        } else if (draftType === 'email') {
          const { subject, body } = await draftCustomerEmail({
            customerName:    await ask('Customer name: '),
            jobName:         await ask('Job name: '),
            jobType:         await ask('Job type: '),
            stage:           await ask('Stage: '),
            lastContact:     await ask('Last contact: '),
            nextStep:        await ask('Next step: '),
            expectedTiming:  await ask('Expected timing: '),
          });
          console.log('\n=== DRAFT EMAIL ===');
          console.log(`SUBJECT: ${subject}`);
          console.log(`\n${body}`);

        } else if (draftType === 'adjuster') {
          const discrepancies = (await ask('Discrepancies (comma-separated): ')).split(',').map(s => s.trim());
          const evidence      = (await ask('Evidence items (comma-separated): ')).split(',').map(s => s.trim());
          const letter = await draftAdjusterLetter({
            adjusterName: await ask('Adjuster name: '),
            carrierName:  await ask('Carrier name: '),
            claimNumber:  await ask('Claim number: '),
            jobName:      await ask('Job name: '),
            discrepancies,
            evidence,
          });
          console.log('\n=== DRAFT ADJUSTER LETTER ===\n' + letter);

        } else if (draftType === 'voice') {
          const note       = await ask('Paste your voice note / raw text (press Enter twice when done):\n');
          const targetType = await ask('Target type (customer|adjuster|crew|crm): ');
          const draft      = await draftFromVoiceNote(note, targetType);
          console.log('\n=== POLISHED DRAFT ===\n' + draft);

        } else if (draftType === 'supplement') {
          console.log('(Supplement letter requires structured line items — use programmatic API for this draft type.)');

        } else {
          console.error(`Unknown draft type: ${draftType}`);
          process.exit(1);
        }
        break;
      }

      // ── Workspace Sync ───────────────────────────────────────────────────────
      case 'workspace-sync': {
        const applyLabels = process.argv.includes('--apply-labels');
        await runWorkspaceSync({ applyLabels });
        break;
      }

      // ── Google Sheets ────────────────────────────────────────────────────────
      case 'google-sheets': {
        const sub = subCommand || 'tracker';
        if (sub === 'tracker')        await updateWeeklyTracker();
        else if (sub === 'ar')        await updateARAgingSummary();
        else if (sub === 'collections') await updateCollectionsDashboard();
        else if (sub === 'money-summary') {
          const summary = await generateMoneySummary();
          console.log('\n=== Money Summary (DRAFT) ===\n' + summary);
        } else {
          console.error(`Unknown google-sheets sub-command: ${sub}`);
          process.exit(1);
        }
        break;
      }

      // ── Google Chat ──────────────────────────────────────────────────────────
      case 'google-chat': {
        await runChatTriage();
        break;
      }

      // ── Vertex AI ────────────────────────────────────────────────────────────
      case 'vertex-ai': {
        const sub = subCommand || 'risk';
        if (sub === 'risk')         await runRiskAnalysis();
        else if (sub === 'summary') await generateWeeklyExecutiveSummary();
        else if (sub === 'scope') {
          const analysis = await validateInsuranceScope({
            jobName:          await ask('Job name: '),
            carrierEstimate:  parseFloat(await ask('Carrier estimate ($): ')),
            fieldEstimate:    parseFloat(await ask('Field estimate ($): ')),
            scopeNotes:       await ask('Scope notes: '),
            discrepancies:    (await ask('Discrepancies (comma-separated): ')).split(',').map(s => s.trim()),
          });
          console.log('\n=== Scope Validation ===\n' + analysis);
        } else if (sub === 'forecast') {
          console.log('(Forecast requires structured supplement data — use programmatic API.)');
        } else {
          console.error(`Unknown vertex-ai sub-command: ${sub}`);
          process.exit(1);
        }
        break;
      }

      // ── Post Dash Notes ──────────────────────────────────────────────────────
      case 'post-dash-notes': {
        // In production, pass the CRM review report as JSON via stdin or a file.
        const confirm = await ask(
          '⚠️  THIS POSTS DIRECTLY TO DASH CRM.\n' +
          'Have you reviewed and approved all CRM note drafts? (yes/no): '
        );
        if (confirm.toLowerCase() !== 'yes') {
          console.log('Aborted — no notes posted.');
          break;
        }
        const notesJson = process.env.APPROVED_NOTES_JSON;
        if (!notesJson) {
          console.error('Set APPROVED_NOTES_JSON to the JSON array of approved notes before running.');
          process.exit(1);
        }
        const approvedNotes = JSON.parse(notesJson);
        await postAllApprovedNotes(approvedNotes);
        break;
      }

      default:
        console.error(`Unknown workflow: ${workflow}`);
        usage();
        process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
