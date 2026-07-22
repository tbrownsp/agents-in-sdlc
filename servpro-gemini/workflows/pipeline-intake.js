// workflows/pipeline-intake.js
// SERVPRO Pipeline Intake + New Lead Engine.
// Creates a full job setup package for every new lead and enforces the
// Pending Sale → WIP stage-gate checklist. DRAFT ONLY.

import { generateFast }   from '../lib/gemini-client.js';
import { createGmailDraft } from '../lib/google-workspace.js';

// ─── Stage-gate checklist ─────────────────────────────────────────────────────

const STAGE_GATE_PENDING_SALE = [
  'Customer name + contact info captured',
  'Job address confirmed',
  'Cause of loss documented',
  'Insurance carrier / adjuster info obtained (if applicable)',
  'Initial estimate or budget range established',
  'Contract sent or scheduled',
  'Deposit collected or scheduled',
  'Access confirmed',
];

const STAGE_GATE_WIP = [
  'Signed contract on file',
  'Deposit received',
  'Work authorization signed',
  'Material selections complete (Recon/Contents)',
  'Crew or sub scheduled',
  'Calendar event created',
  'Drive job folder created with required docs',
  'Customer start-date confirmation sent',
];

// ─── Prompt builders ──────────────────────────────────────────────────────────

function intakePrompt(lead) {
  const missing = STAGE_GATE_PENDING_SALE
    .filter(item => !lead.completedChecks?.includes(item))
    .map((item, i) => `  ${i + 1}. ${item}`)
    .join('\n');

  return `
Create a new job setup package for the following SERVPRO lead.

Lead details:
Name: ${lead.customerName ?? 'UNKNOWN — must capture'}
Address: ${lead.address ?? 'UNKNOWN — must capture'}
Phone: ${lead.phone ?? 'UNKNOWN'}
Email: ${lead.email ?? 'UNKNOWN'}
Cause of loss: ${lead.causeOfLoss ?? 'UNKNOWN — must capture'}
Source: ${lead.source ?? 'unknown'}
Notes: ${lead.notes ?? 'none'}

Missing Pending Sale checklist items:
${missing || '  (none — all items complete)'}

Produce:
1. Initial customer outreach email (subject + body) — introduce Tristan, confirm receipt, request missing info.
2. Internal CRM intake note — first-person PM, captures all known details and flags gaps.
3. Missing-info follow-up email for any unknown required fields.
4. Recommended next action with a specific due date.
`.trim();
}

function stageGatePrompt(job, currentItems) {
  const pendingMissing = STAGE_GATE_PENDING_SALE.filter(i => !currentItems.includes(i));
  const wipMissing     = STAGE_GATE_WIP.filter(i => !currentItems.includes(i));

  return `
Assess this SERVPRO job's readiness to advance from Pending Sale to WIP.

Job: ${job.name} (${job.stage})
Customer: ${job.customer_name}
Completed checklist items: ${currentItems.join(', ') || 'none'}

Pending Sale gate items still missing:
${pendingMissing.map((i, n) => `  ${n + 1}. ${i}`).join('\n') || '  (none)'}

WIP gate items still missing:
${wipMissing.map((i, n) => `  ${n + 1}. ${i}`).join('\n') || '  (none)'}

Produce:
1. Current stage-gate assessment — can this job move to WIP?
2. Priority action list to clear remaining blockers.
3. Draft email or call script for the customer to collect any missing info.
`.trim();
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Process a new incoming lead and produce the full intake package.
 *
 * @param {{
 *   customerName?: string, address?: string, phone?: string, email?: string,
 *   causeOfLoss?: string, source?: string, notes?: string,
 *   completedChecks?: string[]
 * }} lead
 * @returns {Promise<IntakePackage>}
 */
export async function intakeNewLead(lead) {
  console.log(`=== Pipeline Intake — DRAFT MODE ===`);
  console.log(`Lead: ${lead.customerName ?? 'Unknown'} — Source: ${lead.source ?? 'unknown'}`);

  const output = await generateFast(intakePrompt(lead));

  // Parse the outreach email from the output (lines after "1." heading).
  const sections = output.split(/^\d+\.\s+/m).filter(Boolean);
  const [outreachSection, crmNoteSection, missingInfoSection, nextActionSection] = sections;

  // Create Gmail draft for outreach (if email is known).
  let gmailDraftId = null;
  if (lead.email) {
    const subjectMatch = outreachSection?.match(/subject:\s*(.+)/i);
    const subject = subjectMatch?.[1]?.trim() ?? 'SERVPRO — Thank you for reaching out';
    const body    = outreachSection?.replace(/subject:\s*.+\n?/i, '').trim() ?? outreachSection;

    const result = await createGmailDraft({ to: lead.email, subject, body });
    gmailDraftId = result.draftId;
    console.log(`Gmail draft created: ${gmailDraftId}`);
  }

  const pkg = {
    lead,
    output,
    gmailDraftId,
    crmNote:         crmNoteSection?.trim()  ?? null,
    nextAction:      nextActionSection?.trim() ?? null,
  };

  console.log('\nIntake package ready. DRAFT ONLY — nothing posted or sent.');
  return pkg;
}

/**
 * Run the stage-gate compliance check for an existing Pending Sale job.
 *
 * @param {object} job - Dash job object.
 * @param {string[]} completedItems - List of checklist items already completed.
 * @returns {Promise<StageGateReport>}
 */
export async function checkStageGate(job, completedItems = []) {
  console.log(`=== Stage-Gate Check: ${job.name} ===`);
  const output = await generateFast(stageGatePrompt(job, completedItems));

  const canAdvance = !output.toLowerCase().includes('cannot move') &&
                     !output.toLowerCase().includes('not ready');

  return { job: job.id, jobName: job.name, canAdvance, output };
}

/**
 * Return the Pending Sale and WIP stage-gate checklists.
 *
 * @returns {{ pendingSale: string[], wip: string[] }}
 */
export function getStagGateChecklists() {
  return {
    pendingSale: [...STAGE_GATE_PENDING_SALE],
    wip:         [...STAGE_GATE_WIP],
  };
}
