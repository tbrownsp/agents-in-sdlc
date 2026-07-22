// workflows/gemini-drafts.js
// SERVPRO Gemini Draft Generation — converts job data, voice notes, and
// supplement discrepancy lists into polished drafts in Tristan's voice.
// DRAFT ONLY — nothing is sent or posted until Tristan explicitly approves.

import { generateFast, generatePro, qualityCheck } from '../lib/gemini-client.js';

// ─── CRM Note Draft ──────────────────────────────────────────────────────────

/**
 * Generate a Dash CRM note from a structured job breakdown.
 *
 * @param {{
 *   jobName: string, stage: string, lastContact: string,
 *   blocker: string, nextAction: string, followUpTrigger: string
 * }} jobData
 * @returns {Promise<string>} Draft CRM note.
 */
export async function draftCRMNote(jobData) {
  const prompt = `
Write a Dash CRM note for the following job using the 5-part formula:
1. Current Status
2. Recent Action
3. Blocker / Dependency
4. Next Action
5. Follow-up Date or Trigger

Job: ${jobData.jobName}
Stage: ${jobData.stage}
Last customer contact: ${jobData.lastContact}
Current blocker: ${jobData.blocker}
Planned next action: ${jobData.nextAction}
Follow-up trigger: ${jobData.followUpTrigger}

Write in first-person PM voice. Do not say Pending Sale money is overdue.
`.trim();

  const raw = await generateFast(prompt);
  const { draft } = await qualityCheck(raw);
  return draft;
}

// ─── Customer Follow-Up Email Draft ─────────────────────────────────────────

/**
 * Generate a customer follow-up email.
 *
 * @param {{
 *   customerName: string, jobName: string, jobType: string,
 *   stage: string, lastContact: string, nextStep: string, expectedTiming: string
 * }} data
 * @returns {Promise<{subject: string, body: string}>}
 */
export async function draftCustomerEmail(data) {
  const prompt = `
Draft a professional customer follow-up email for a SERVPRO restoration project.
Tone: Tristan's voice — direct, professional, accountable, calm.
Include: current status, what we are doing or waiting on, next step, expected timing.
Output format:
SUBJECT: <subject line>
BODY:
<email body>

Customer: ${data.customerName}
Job: ${data.jobName} (${data.jobType})
Stage: ${data.stage}
Last contact: ${data.lastContact}
Next step: ${data.nextStep}
Expected timing: ${data.expectedTiming}
`.trim();

  const raw     = await generateFast(prompt);
  const subject = raw.match(/^SUBJECT:\s*(.+)$/m)?.[1]?.trim() ?? `Update on your ${data.jobType} project`;
  const body    = raw.replace(/^SUBJECT:.*\n/m, '').replace(/^BODY:\s*\n/m, '').trim();
  return { subject, body };
}

// ─── Adjuster / Carrier Follow-Up Letter ─────────────────────────────────────

/**
 * Generate an adjuster follow-up letter (uses pro model for quality).
 *
 * @param {{
 *   adjusterName: string, carrierName: string, claimNumber: string,
 *   jobName: string, discrepancies: string[], evidence: string[]
 * }} data
 * @returns {Promise<string>} Draft letter body.
 */
export async function draftAdjusterLetter(data) {
  const discList = data.discrepancies.map((d, i) => `  ${i + 1}. ${d}`).join('\n');
  const evList   = data.evidence.map((e, i) => `  ${i + 1}. ${e}`).join('\n');

  const prompt = `
Write a professional follow-up letter to an insurance adjuster regarding scope
discrepancies on a SERVPRO restoration project. Evidence-based, scope-specific,
professional — no emotional language. Request resolution of each line-item discrepancy.

Adjuster: ${data.adjusterName}
Carrier: ${data.carrierName}
Claim: ${data.claimNumber}
Job: ${data.jobName}

Discrepancies:
${discList}

Supporting evidence:
${evList}
`.trim();

  const raw           = await generatePro(prompt);
  const { draft }     = await qualityCheck(raw);
  return draft;
}

// ─── Voice Note → Polished Communication ────────────────────────────────────

/**
 * Convert rough voice notes or bullet points into polished communication.
 *
 * @param {string} voiceNote - Raw transcript or bullet points from Tristan.
 * @param {'customer' | 'adjuster' | 'crew' | 'crm'} targetType
 * @returns {Promise<string>} Polished draft.
 */
export async function draftFromVoiceNote(voiceNote, targetType = 'customer') {
  const targetDesc = {
    customer: 'a calm, professional customer update email',
    adjuster: 'a professional adjuster follow-up letter',
    crew:     'a clear crew coordination message',
    crm:      'a first-person Dash CRM note using the 5-part formula',
  }[targetType] ?? 'professional communication';

  const prompt = `
Rewrite the following rough notes as ${targetDesc} in first-person PM voice.
Remove frustration or informal language. Keep accountability and directness.
Do not say Pending Sale money is overdue.

RAW NOTES:
${voiceNote}
`.trim();

  const raw       = await generateFast(prompt);
  const { draft } = await qualityCheck(raw);
  return draft;
}

// ─── Supplement Summary Letter ───────────────────────────────────────────────

/**
 * Generate a supplement summary letter for open supplement requests (pro model).
 *
 * @param {{
 *   jobName: string, adjusterName: string, carrierName: string, claimNumber: string,
 *   lineItems: Array<{description: string, qty: number, unit: string, price: number, carrierAllowed: number}>,
 *   supportingEvidence: string[]
 * }} data
 * @returns {Promise<string>} Draft supplement letter.
 */
export async function draftSupplementLetter(data) {
  const itemList = data.lineItems.map((item, i) =>
    `  ${i + 1}. ${item.description}: Qty ${item.qty} ${item.unit} @ $${item.price.toFixed(2)} ` +
    `(carrier allowed: $${item.carrierAllowed.toFixed(2)}, gap: $${(item.price - item.carrierAllowed).toFixed(2)})`
  ).join('\n');

  const evList = data.supportingEvidence.map((e, i) => `  ${i + 1}. ${e}`).join('\n');

  const prompt = `
Write a formal supplement request letter to an insurance carrier.
Format: professional business letter. Structure: introduction, itemized discrepancies,
evidence summary, requested resolution, closing.

Job: ${data.jobName}
Adjuster: ${data.adjusterName}
Carrier: ${data.carrierName}
Claim #: ${data.claimNumber}

Line-item discrepancies:
${itemList}

Supporting evidence:
${evList}
`.trim();

  return generatePro(prompt);
}
