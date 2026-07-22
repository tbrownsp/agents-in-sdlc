// workflows/crm-review.js
// SERVPRO CRM Truth Review — pulls all open jobs, flags missing info and stale
// communication, then generates per-job CRM note + email drafts via Gemini.
// DRAFT ONLY — nothing is posted to Dash or sent until Tristan approves.

import { getOpenJobs, getJobNotes, getJobTasks, isStale, requiredDocs } from '../lib/dash-client.js';
import { generateFast, qualityCheck }                                     from '../lib/gemini-client.js';
import { createGmailDraft }                                               from '../lib/google-workspace.js';

// Required intake fields every job must have.
const REQUIRED_INTAKE = [
  'customer_name', 'address', 'access_instructions',
  'customer_phone', 'customer_email', 'cause_of_loss',
];

// ─── Step helpers ─────────────────────────────────────────────────────────────

function checkMissingIntake(job) {
  return REQUIRED_INTAKE.filter(f => !job[f]);
}

function checkMissingDocs(job) {
  const required = requiredDocs(job.type);
  const present  = (job.docs ?? []).map(d => d.name);
  return required.filter(r => !present.includes(r));
}

function buildCRMPrompt(job, missingInfo, missingDocs, notes, tasks) {
  const lastNote    = notes[0]?.created_at  ?? 'unknown';
  const lastContact = job.last_customer_contact ?? 'unknown';
  const openTasks   = tasks.filter(t => !t.completed).map(t => t.description).join('; ') || 'none';

  return `
Write a Dash CRM note for the following job using the 5-part formula:
1. Current Status — what is true right now.
2. Recent Action — who was contacted or what changed.
3. Blocker / Dependency — what is blocking advancement.
4. Next Action — exactly what happens next and who owns it.
5. Follow-up Date or Trigger — when to revisit.

Job: ${job.name} (${job.job_number})
Stage: ${job.stage}
Type: ${job.type}
Customer: ${job.customer_name} | ${job.customer_phone}
Insurance: ${job.insurance_carrier ?? 'N/A'} — Adjuster: ${job.adjuster_name ?? 'N/A'}
Last CRM note: ${lastNote}
Last customer contact: ${lastContact}
Open tasks: ${openTasks}
Missing intake fields: ${missingInfo.length ? missingInfo.join(', ') : 'none'}
Missing documents: ${missingDocs.length ? missingDocs.join(', ') : 'none'}

Write the note in first-person PM voice. Do NOT say Pending Sale money is overdue.
Include a specific follow-up date or trigger at the end.
`.trim();
}

function buildEmailPrompt(job) {
  return `
Draft a professional follow-up email to the customer for the following job.
Use Tristan's voice — direct, professional, accountable, calm.
Include: current status, what we are waiting on or doing next, expected timing.

Job: ${job.name}
Customer: ${job.customer_name}
Stage: ${job.stage}
Last contact: ${job.last_customer_contact ?? 'unknown'}
`.trim();
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run the full CRM review for all open jobs assigned to Tristan.
 * Returns a report object containing per-job breakdowns and draft outputs.
 *
 * @returns {Promise<CRMReviewReport>}
 */
export async function runCRMReview() {
  console.log('=== SERVPRO CRM Review — DRAFT MODE ===');
  console.log('Pulling open jobs from Dash…');
  const jobs = await getOpenJobs();
  console.log(`Found ${jobs.length} open job(s).`);

  const report = {
    runAt:   new Date().toISOString(),
    jobs:    [],
    staleJobs: [],
    drafts:  { crmNotes: [], gmailDrafts: [] },
  };

  for (const job of jobs) {
    console.log(`\nReviewing: ${job.name} (${job.stage})`);

    const [notes, tasks] = await Promise.all([
      getJobNotes(job.id),
      getJobTasks(job.id),
    ]);

    const missingInfo  = checkMissingIntake(job);
    const missingDocs  = checkMissingDocs(job);
    const stale        = isStale(job.last_customer_contact) && isStale(notes[0]?.created_at);

    const jobEntry = {
      id:          job.id,
      name:        job.name,
      stage:       job.stage,
      type:        job.type,
      missingInfo,
      missingDocs,
      stale,
      lastNoteAge: notes[0]?.created_at ?? null,
      blocker:     null,
      nextAction:  null,
      draftNote:   null,
      draftEmail:  null,
    };

    // Generate CRM note draft.
    console.log(`  Generating CRM note draft via Gemini…`);
    const rawNote  = await generateFast(buildCRMPrompt(job, missingInfo, missingDocs, notes, tasks));
    const { draft: checkedNote, passed, issues } = await qualityCheck(rawNote);
    if (!passed) console.log(`  Quality issues found: ${issues.join(' | ')}`);
    jobEntry.draftNote = checkedNote;
    report.drafts.crmNotes.push({ jobId: job.id, jobName: job.name, note: checkedNote });

    // Generate follow-up email draft for stale jobs.
    if (stale) {
      report.staleJobs.push(job.id);
      console.log(`  Stale (48+ hrs) — generating follow-up email draft…`);
      const emailDraft = await generateFast(buildEmailPrompt(job));
      jobEntry.draftEmail = emailDraft;
      // Create Gmail draft (stored only — not sent).
      if (job.customer_email) {
        const gmailResult = await createGmailDraft({
          to:      job.customer_email,
          subject: `Update on your ${job.type} project — ${job.name}`,
          body:    emailDraft,
        });
        console.log(`  Gmail draft created: ${gmailResult.draftId}`);
        report.drafts.gmailDrafts.push({ jobId: job.id, ...gmailResult });
      }
    }

    report.jobs.push(jobEntry);
  }

  console.log('\n=== CRM Review complete. ALL OUTPUTS ARE DRAFTS. ===');
  console.log(`Jobs reviewed : ${report.jobs.length}`);
  console.log(`Stale alerts  : ${report.staleJobs.length}`);
  console.log(`CRM drafts    : ${report.drafts.crmNotes.length}`);
  console.log(`Gmail drafts  : ${report.drafts.gmailDrafts.length}`);
  console.log('Nothing posted to Dash. Proceed to approval gate.');

  return report;
}
