// workflows/post-dash-notes.js
// SERVPRO — Post Approved Notes to Dash CRM (EXECUTED LAST).
// POLICY: This workflow MUST only run after Tristan has explicitly approved
// the draft notes from crm-review. The APPROVAL_TOKEN env var gates execution.

import { postNote }   from '../lib/dash-client.js';

// ─── Approval gate ────────────────────────────────────────────────────────────

function assertApproved() {
  const token = process.env.TRISTAN_APPROVAL_TOKEN;
  if (!token) {
    throw new Error(
      'TRISTAN_APPROVAL_TOKEN is not set.\n' +
      'This workflow must only run after Tristan has explicitly approved all drafts.\n' +
      'Set TRISTAN_APPROVAL_TOKEN in your environment to confirm approval.'
    );
  }
  console.log('Approval token verified — proceeding to post notes.');
}

// ─── Post a single approved note ─────────────────────────────────────────────

/**
 * Post one approved CRM note to Dash for a specific job.
 * POLICY: append-only — existing notes are never overwritten.
 *
 * @param {string} jobId
 * @param {string} noteBody
 * @returns {Promise<{jobId: string, noteId: string}>}
 */
export async function postApprovedNote(jobId, noteBody) {
  assertApproved();

  console.log(`Posting note to Dash job ${jobId}…`);
  const result = await postNote(jobId, noteBody);
  console.log(`  Note posted: ${result.noteId}`);
  return { jobId, noteId: result.noteId };
}

// ─── Batch post all approved notes ───────────────────────────────────────────

/**
 * Post all approved CRM notes from a CRM review report to Dash.
 * Expects the `drafts.crmNotes` array from runCRMReview().
 *
 * @param {Array<{jobId: string, jobName: string, note: string}>} approvedNotes
 * @returns {Promise<PostReport>}
 */
export async function postAllApprovedNotes(approvedNotes) {
  assertApproved();

  if (!approvedNotes?.length) {
    console.log('No approved notes to post.');
    return { posted: [], errors: [] };
  }

  console.log('=== SERVPRO Post Approved Notes — LIVE WRITE TO DASH ===');
  console.log(`Posting ${approvedNotes.length} note(s)…`);

  const posted = [];
  const errors = [];

  for (const { jobId, jobName, note } of approvedNotes) {
    try {
      const result = await postNote(jobId, note);
      posted.push({ jobId, jobName, noteId: result.noteId });
      console.log(`  ✓ ${jobName} — note posted (${result.noteId})`);
    } catch (err) {
      errors.push({ jobId, jobName, error: err.message });
      console.error(`  ✗ ${jobName} — post failed: ${err.message}`);
    }
  }

  console.log(`\nPost complete — ${posted.length} posted, ${errors.length} error(s).`);
  return { posted, errors };
}
