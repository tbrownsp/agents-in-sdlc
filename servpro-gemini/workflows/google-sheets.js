// workflows/google-sheets.js
// SERVPRO Google Sheets Financial Tracker + Job Pipeline Board.
// Maintains the Weekly Management Accountability Tracker, A/R Aging Summary,
// Collections Dashboard, Crew Production Log, and Job Pipeline Board.
// All writes are draft-only until Tristan approves.

import { getOpenJobs }                       from '../lib/dash-client.js';
import { appendSheetRow, readSheetRange }    from '../lib/google-workspace.js';
import { generateFast }                      from '../lib/gemini-client.js';

const SPREADSHEET_ID = process.env.SERVPRO_SPREADSHEET_ID || '';

// ─── Sheet names ──────────────────────────────────────────────────────────────

export const SHEETS = {
  TRACKER:    'Weekly Management Accountability Tracker',
  AR_AGING:   'A/R Aging Summary',
  COLLECTIONS:'Collections Dashboard',
  CREW_LOG:   'Crew Production Log',
  PIPELINE:   'Job Pipeline Board',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysOld(isoDate) {
  if (!isoDate) return null;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

function arFlag(days) {
  if (days === null) return '';
  if (days > 90) return '⚠️ ESCALATE';
  if (days > 60) return '⚠️ OVERDUE';
  if (days > 30) return '📌 WATCH';
  return '';
}

// ─── Weekly Tracker Update ────────────────────────────────────────────────────

/**
 * Append one row per open job to the Weekly Management Accountability Tracker.
 * Row format: Date | Job Name | Stage | Type | Customer | Blocker | Next Action | Risk
 *
 * @returns {Promise<void>}
 */
export async function updateWeeklyTracker() {
  if (!SPREADSHEET_ID) throw new Error('SERVPRO_SPREADSHEET_ID is not set.');
  console.log('=== Updating Weekly Management Accountability Tracker ===');

  const jobs = await getOpenJobs();
  const date = new Date().toLocaleDateString('en-US');

  for (const job of jobs) {
    const row = [
      date,
      job.name,
      job.job_number ?? '',
      job.stage,
      job.type,
      job.customer_name,
      job.blocker ?? '',
      job.next_action ?? '',
      job._riskFlag ?? '',
    ];
    await appendSheetRow({ spreadsheetId: SPREADSHEET_ID, sheetName: SHEETS.TRACKER, values: row });
    console.log(`  Added row: ${job.name} | ${job.stage}`);
  }
  console.log(`Tracker updated — ${jobs.length} rows added.`);
}

// ─── A/R Aging Summary ────────────────────────────────────────────────────────

/**
 * Append A/R aging rows for all jobs in Invoice Pending or A/R stage.
 *
 * @returns {Promise<void>}
 */
export async function updateARAgingSummary() {
  if (!SPREADSHEET_ID) throw new Error('SERVPRO_SPREADSHEET_ID is not set.');
  console.log('=== Updating A/R Aging Summary ===');

  const jobs  = await getOpenJobs();
  const arJobs = jobs.filter(j => ['Invoice Pending', 'A/R'].includes(j.stage));
  const date   = new Date().toLocaleDateString('en-US');

  for (const job of arJobs) {
    const days = daysOld(job.invoice_date);
    const row  = [
      date,
      job.name,
      job.customer_name,
      job.insurance_carrier ?? 'Retail',
      job.invoice_amount ? `$${job.invoice_amount.toFixed(2)}` : '',
      days ?? '',
      arFlag(days),
    ];
    await appendSheetRow({ spreadsheetId: SPREADSHEET_ID, sheetName: SHEETS.AR_AGING, values: row });
    console.log(`  A/R: ${job.name} — ${days ?? '?'} days old ${arFlag(days)}`);
  }
  console.log(`A/R Aging updated — ${arJobs.length} rows.`);
}

// ─── Collections Dashboard ────────────────────────────────────────────────────

/**
 * Append collections data for all jobs with financial info.
 *
 * @returns {Promise<void>}
 */
export async function updateCollectionsDashboard() {
  if (!SPREADSHEET_ID) throw new Error('SERVPRO_SPREADSHEET_ID is not set.');
  console.log('=== Updating Collections Dashboard ===');

  const jobs = await getOpenJobs();
  const date = new Date().toLocaleDateString('en-US');

  for (const job of jobs) {
    const invoiced   = job.invoice_amount  ?? 0;
    const collected  = job.amount_collected ?? 0;
    const outstanding = invoiced - collected;
    const pct        = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;

    const row = [
      date,
      job.name,
      job.stage,
      invoiced   ? `$${invoiced.toFixed(2)}`    : '',
      collected  ? `$${collected.toFixed(2)}`   : '',
      outstanding ? `$${outstanding.toFixed(2)}`: '',
      `${pct}%`,
    ];
    await appendSheetRow({ spreadsheetId: SPREADSHEET_ID, sheetName: SHEETS.COLLECTIONS, values: row });
  }
  console.log(`Collections Dashboard updated — ${jobs.length} rows.`);
}

// ─── Money Summary (by stage) — Gemini-formatted ─────────────────────────────

/**
 * Generate a Gemini-formatted money summary by customer/stage.
 *
 * @returns {Promise<string>} Formatted summary text.
 */
export async function generateMoneySummary() {
  const jobs = await getOpenJobs();

  const stageGroups = {};
  for (const job of jobs) {
    if (!stageGroups[job.stage]) stageGroups[job.stage] = [];
    stageGroups[job.stage].push(job);
  }

  const stageText = Object.entries(stageGroups).map(([stage, stageJobs]) => {
    const lines = stageJobs.map(j => {
      const amt = j.invoice_amount ? ` | $${j.invoice_amount.toFixed(2)}` : '';
      return `  - ${j.customer_name}: ${j.name}${amt}`;
    }).join('\n');
    return `${stage} (${stageJobs.length}):\n${lines}`;
  }).join('\n\n');

  const prompt = `
Produce a by-customer money summary for SERVPRO Bartlett/Cordova.
Do NOT describe Pending Sale amounts as overdue. Clearly separate each stage.
Keep it concise and management-ready.

DATA:
${stageText}
`.trim();

  return generateFast(prompt);
}
