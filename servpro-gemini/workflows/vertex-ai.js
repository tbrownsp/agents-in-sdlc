// workflows/vertex-ai.js
// SERVPRO Vertex AI Studio — Gemini Enterprise risk analysis + batch summaries.
// Uses aiplatform.googleapis.com with Workload Identity Federation.
// All outputs are analysis only — no Dash or Workspace writes without approval.

import { generatePro, generateFast } from '../lib/gemini-client.js';
import { getOpenJobs }               from '../lib/dash-client.js';

// ─── Risk analysis ────────────────────────────────────────────────────────────

/**
 * Score and rank open jobs by financial and schedule risk.
 * Returns jobs ordered from highest to lowest risk with explanations.
 *
 * @returns {Promise<RiskAnalysisReport>}
 */
export async function runRiskAnalysis() {
  console.log('=== SERVPRO Vertex AI — Risk Analysis ===');
  const jobs = await getOpenJobs();

  const jobList = jobs.map(j =>
    `- ${j.name} | Stage: ${j.stage} | Invoice: $${j.invoice_amount ?? 0} | ` +
    `Last contact: ${j.last_customer_contact ?? 'unknown'} | Open tasks: ${j._openTaskCount ?? '?'} | ` +
    `Days in stage: ${j.days_in_stage ?? '?'}`
  ).join('\n');

  const prompt = `
Perform a financial and schedule risk analysis for the following SERVPRO restoration jobs.
For each job, assign a risk score (1–10) and provide a one-sentence explanation.
Sort from highest to lowest risk. Highlight any jobs at critical risk.

Consider: stage duration, invoice size, communication staleness, open tasks,
  insurance complexity, collection risk, and production blockers.

JOBS:
${jobList}

Output: ranked list with risk score, category (Financial / Schedule / Both / Low), and explanation.
`.trim();

  const output = await generatePro(prompt);
  console.log('\nRisk Analysis (Gemini Enterprise / pro model):');
  console.log(output);

  return { runAt: new Date().toISOString(), jobCount: jobs.length, output };
}

// ─── Insurance scope validation ───────────────────────────────────────────────

/**
 * Validate whether a carrier estimate aligns with field conditions.
 *
 * @param {{
 *   jobName: string, carrierEstimate: number, fieldEstimate: number,
 *   scopeNotes: string, discrepancies: string[]
 * }} data
 * @returns {Promise<string>} Validation analysis.
 */
export async function validateInsuranceScope(data) {
  const gap = data.fieldEstimate - data.carrierEstimate;

  const prompt = `
Analyze the following insurance scope discrepancy for a SERVPRO restoration job.
Provide a structured assessment: is the gap reasonable, what evidence supports the
higher field estimate, and what is the recommended supplement strategy.

Job: ${data.jobName}
Carrier estimate: $${data.carrierEstimate.toFixed(2)}
Field estimate:   $${data.fieldEstimate.toFixed(2)}
Gap:              $${gap.toFixed(2)} (${gap > 0 ? '+' : ''}${((gap / data.carrierEstimate) * 100).toFixed(1)}%)
Scope notes: ${data.scopeNotes}
Discrepancies:
${data.discrepancies.map((d, i) => `  ${i + 1}. ${d}`).join('\n')}

Produce: scope validation assessment + recommended supplement action items.
`.trim();

  return generatePro(prompt);
}

// ─── Supplement approval forecasting ─────────────────────────────────────────

/**
 * Forecast the probability that open supplements will be approved,
 * based on documented patterns.
 *
 * @param {Array<{jobName: string, carrier: string, gapAmount: number, evidenceStrength: string}>} supplements
 * @returns {Promise<string>} Forecast analysis.
 */
export async function forecastSupplementApprovals(supplements) {
  const list = supplements.map((s, i) =>
    `  ${i + 1}. ${s.jobName} | Carrier: ${s.carrier} | Gap: $${s.gapAmount.toFixed(2)} | Evidence: ${s.evidenceStrength}`
  ).join('\n');

  const prompt = `
Forecast which open SERVPRO supplement requests are most likely to be approved
based on the carrier, gap amount, and evidence strength.
Rank each from most to least likely to be approved and explain why.

OPEN SUPPLEMENTS:
${list}

Output: ranked forecast with probability estimate (High/Med/Low) and recommended next action per supplement.
`.trim();

  return generatePro(prompt);
}

// ─── End-of-week executive summary ───────────────────────────────────────────

/**
 * Generate an end-of-week executive summary across all open jobs.
 *
 * @returns {Promise<string>} Executive summary text.
 */
export async function generateWeeklyExecutiveSummary() {
  console.log('=== Vertex AI — End-of-Week Executive Summary ===');
  const jobs = await getOpenJobs();

  const jobList = jobs.map(j =>
    `- ${j.name} | ${j.stage} | Customer: ${j.customer_name} | Invoice: $${j.invoice_amount ?? 0}`
  ).join('\n');

  const prompt = `
Write a concise end-of-week executive summary for SERVPRO Bartlett/Cordova.
Audience: Tristan Brown (owner/PM). Tone: direct, management-ready.

Include:
1. Total active jobs by stage with financial totals.
2. Top 3 wins or advances this week.
3. Top 3 risks or blockers requiring attention.
4. Next-week priorities.
5. AR/collections snapshot (do not call Pending Sale money overdue).

OPEN JOBS:
${jobList}
`.trim();

  const summary = await generateFast(prompt);
  console.log('\nExecutive Summary (DRAFT):');
  console.log(summary);
  return summary;
}
