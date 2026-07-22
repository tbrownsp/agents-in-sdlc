// workflows/ops-review.js
// SERVPRO Mon/Wed/Fri Operational Review + Crew Accountability.
// Runs the recurring ops cadence and produces management-ready outputs for
// Tristan's review. Nothing is sent or posted until explicitly approved.

import { getOpenJobs, getJobTasks, isStale } from '../lib/dash-client.js';
import { generateFast }                       from '../lib/gemini-client.js';

// ─── Calendar color IDs (Google Calendar)
// See: https://developers.google.com/calendar/api/v3/reference/colors
/** @type {Record<string, string>} Maps role → Google Calendar colorId */
export const CAL_COLORS = {
  outOfOffice: '5',  // yellow
  inOffice:    '4',  // red
  onSite:      '9',  // berry/blue
  virtual:     '6',  // tangerine/orange
};

// ─── Day-of-week detection ────────────────────────────────────────────────────

function getDay() {
  const day = process.env.OPS_REVIEW_DAY;                    // override in tests
  const d   = day ? new Date(day) : new Date();
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

function mondayPrompt(jobs) {
  const summary = jobs.map(j =>
    `- ${j.name} (${j.stage}): last contact ${j.last_customer_contact ?? 'unknown'}`
  ).join('\n');

  return `
It is Monday morning. Produce the weekly ops planning output for SERVPRO Bartlett/Cordova.

OPEN JOBS:
${summary}

Required output:
1. Weekly crew scheduling recommendations (Mon–Wed WIP site visits, Tue/Thu Pending Sale visits, Fri admin).
2. Calendar protection blocks: Monday morning 2-hr office block, Thursday 1-hr Elizabeth sync, Friday full office day.
3. Per-job priority ranking by risk (financial + schedule).
4. One-sentence next action per job.
5. Money summary: stage breakdown counts (Pending Sale, WIP, A/R, etc.).

Format clearly. Write in first-person PM voice.
`.trim();
}

function wednesdayPrompt(jobs) {
  const summary = jobs.map(j =>
    `- ${j.name} (${j.stage}): tasks open: ${j._openTaskCount ?? 0}, stale: ${j._stale ? 'YES' : 'no'}`
  ).join('\n');

  return `
It is Wednesday morning. Produce the midweek KPI and blocker review for SERVPRO Bartlett/Cordova.

OPEN JOBS (with task and stale flags):
${summary}

Required output:
1. Active blockers per job — what is stopping advancement.
2. KPI flags — any job at financial or schedule risk.
3. Crew compliance check — flag any job where crew has not submitted photos in 48+ hours.
4. Recommended calendar adjustments for Thursday–Friday.
5. Draft crew follow-up messages for jobs with photo non-compliance.

Format clearly. Write in first-person PM voice.
`.trim();
}

function fridayPrompt(jobs) {
  const summary = jobs.map(j =>
    `- ${j.name} (${j.stage}): stage, last contact ${j.last_customer_contact ?? 'unknown'}`
  ).join('\n');

  return `
It is Friday. Produce the weekly closeout, tracker update, and money summary for SERVPRO Bartlett/Cordova.

OPEN JOBS:
${summary}

Required output:
1. Weekly closeout summary — what moved or closed this week.
2. By-customer money summary: Pending Sale (not overdue), WIP (in production), A/R (payment pending), Closeout.
3. Jobs needing documentation before close (COS, lien waiver, final photos).
4. Next-week priority list (top 5 jobs by urgency).
5. Friday admin checklist: Drive file review, Gmail label cleanup, Sheets tracker update.

Format clearly. Write in first-person PM voice. Do not describe Pending Sale money as overdue.
`.trim();
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run the ops review appropriate for today's day of week.
 * Returns a report object with the AI-generated cadence output.
 *
 * @returns {Promise<OpsReviewReport>}
 */
export async function runOpsReview() {
  const day = getDay();
  const validDays = ['Monday', 'Wednesday', 'Friday'];

  if (!validDays.includes(day)) {
    console.log(`Ops review runs on Mon/Wed/Fri only. Today is ${day} — skipping.`);
    return { day, skipped: true };
  }

  console.log(`=== SERVPRO Ops Review — ${day.toUpperCase()} — DRAFT MODE ===`);
  console.log('Pulling open jobs…');
  const jobs = await getOpenJobs();

  // Annotate jobs with task counts and stale flag.
  for (const job of jobs) {
    const tasks       = await getJobTasks(job.id);
    job._openTaskCount = tasks.filter(t => !t.completed).length;
    job._stale         = isStale(job.last_customer_contact);
  }

  console.log(`Running ${day} cadence for ${jobs.length} job(s)…`);

  const promptFn = { Monday: mondayPrompt, Wednesday: wednesdayPrompt, Friday: fridayPrompt }[day];
  const output   = await generateFast(promptFn(jobs));

  const report = {
    runAt:  new Date().toISOString(),
    day,
    jobs:   jobs.length,
    output,
  };

  console.log('\n=== Ops Review output (DRAFT) ===');
  console.log(output);
  console.log('\nReview and approve before taking any actions.');

  return report;
}
