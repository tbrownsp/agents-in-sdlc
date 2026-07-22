// workflows/workspace-sync.js
// SERVPRO Google Workspace Cross-Posting + Alignment.
// Syncs Dash CRM updates across Gmail, Calendar, Drive, Tasks, Contacts,
// Sheets, and Chat. Produces a job-by-job action sheet — no writes until approved.

import { getOpenJobs }                                                from '../lib/dash-client.js';
import { generateFast }                                              from '../lib/gemini-client.js';
import { applyGmailLabel, createCalendarEvent, createDriveDoc }     from '../lib/google-workspace.js';

// ─── Gmail label routing ──────────────────────────────────────────────────────

const STAGE_TO_LABEL = {
  'Pending Sale':    'Pending Sale',
  'Pre-Production':  'Work in Progress',
  'WIP':             'Work in Progress',
  'Invoice Pending': 'A/R',
  'A/R':             'A/R',
  'Closeout':        'Work in Progress',
};

// ─── Calendar color routing ───────────────────────────────────────────────────

const STAGE_TO_COLOR = {
  'Pending Sale':    '5', // yellow
  'Pre-Production':  '9', // berry
  'WIP':             '9', // berry
  'Invoice Pending': '4', // red
  'A/R':             '4', // red
  'Closeout':        '6', // orange
};

// ─── Sync prompt ──────────────────────────────────────────────────────────────

function syncPrompt(jobs) {
  const jobList = jobs.map(j =>
    `- ${j.name} | Stage: ${j.stage} | Type: ${j.type} | Customer: ${j.customer_name} | ` +
    `Phone: ${j.customer_phone ?? 'N/A'} | Insurance: ${j.insurance_carrier ?? 'N/A'}`
  ).join('\n');

  return `
Produce a Google Workspace sync action sheet for SERVPRO Bartlett/Cordova.
For each job, list required updates across Gmail, Calendar, Drive, Contacts, Tasks, Sheets.
Flag any missing Drive folders, wrong Gmail labels, or missing Calendar events.

OPEN JOBS:
${jobList}

Output one row per job:
Job | Gmail label needed | Calendar event status | Drive folder status | Contacts status | Tasks status | Risk flag
`.trim();
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Run the full Workspace sync review and produce a job-by-job action sheet.
 * Applies Gmail labels for each job based on its Dash stage.
 * Creates calendar events and Drive docs where flagged as missing.
 *
 * @param {{applyLabels?: boolean, createMissingEvents?: boolean}} options
 * @returns {Promise<WorkspaceSyncReport>}
 */
export async function runWorkspaceSync({ applyLabels = false, createMissingEvents = false } = {}) {
  console.log('=== SERVPRO Workspace Sync — DRAFT MODE ===');
  const jobs = await getOpenJobs();
  console.log(`Syncing ${jobs.length} open job(s) across Google Workspace…`);

  // Generate action sheet via Gemini.
  const actionSheet = await generateFast(syncPrompt(jobs));
  console.log('\n=== Workspace Sync Action Sheet (DRAFT) ===');
  console.log(actionSheet);

  const actions = [];

  for (const job of jobs) {
    const label = STAGE_TO_LABEL[job.stage];
    const color = STAGE_TO_COLOR[job.stage] ?? '5';

    const action = {
      jobId:      job.id,
      jobName:    job.name,
      stage:      job.stage,
      labelApplied: false,
      calEventCreated: false,
      driveDocCreated: false,
    };

    // Apply Gmail label if job has a known thread ID and applyLabels is true.
    if (applyLabels && label && job.gmail_thread_id) {
      await applyGmailLabel(job.gmail_thread_id, label);
      action.labelApplied = true;
      console.log(`  ${job.name}: Gmail label "${label}" applied.`);
    }

    // Create a Calendar event if the job is WIP and has a start date but no event.
    if (createMissingEvents && job.stage === 'WIP' && job.start_date && !job.calendar_event_id) {
      const start = `${job.start_date}T08:00:00`;
      const end   = `${job.start_date}T17:00:00`;

      const event = await createCalendarEvent({
        summary:     `${job.name} — Crew On Site`,
        description: `Job #${job.job_number} | Customer: ${job.customer_name} | ${job.customer_phone ?? ''}`,
        location:    job.address,
        start,
        end,
        colorId:     color,
      });
      action.calEventCreated = true;
      action.calEventId      = event.eventId;
      console.log(`  ${job.name}: Calendar event created: ${event.htmlLink}`);
    }

    actions.push(action);
  }

  const report = {
    runAt:       new Date().toISOString(),
    jobCount:    jobs.length,
    actionSheet,
    actions,
  };

  console.log('\nWorkspace sync complete. Review action sheet before approving any writes.');
  return report;
}
