// lib/dash-client.js
// Dash CRM (Next Gear) API client for SERVPRO Bartlett/Cordova.
// All writes require explicit approval — this module enforces draft-only policy
// except for the post-dash-notes workflow, which must call postNote() directly.

const BASE_URL  = process.env.DASH_API_BASE_URL  || '';
const API_TOKEN = process.env.DASH_API_TOKEN      || '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function dashFetch(path, options = {}) {
  if (!BASE_URL || !API_TOKEN) {
    throw new Error(
      'DASH_API_BASE_URL and DASH_API_TOKEN must be set in your .env file.'
    );
  }
  const { default: fetch } = await import('node-fetch');
  const url      = `${BASE_URL.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + API_TOKEN,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Dash API error ${response.status} on ${path}: ${body}`);
  }
  return response.json();
}

// ─── Job queries ──────────────────────────────────────────────────────────────

/**
 * Return all open jobs assigned to Tristan.
 *
 * @returns {Promise<Job[]>}
 */
export async function getOpenJobs() {
  return dashFetch('/jobs?status=open&assignee=tristan');
}

/**
 * Return a single job by ID.
 *
 * @param {string} jobId
 * @returns {Promise<Job>}
 */
export async function getJob(jobId) {
  return dashFetch(`/jobs/${jobId}`);
}

/**
 * Return the CRM notes for a job (most recent first).
 *
 * @param {string} jobId
 * @returns {Promise<Note[]>}
 */
export async function getJobNotes(jobId) {
  return dashFetch(`/jobs/${jobId}/notes?sort=desc`);
}

/**
 * Return the task list for a job.
 *
 * @param {string} jobId
 * @returns {Promise<Task[]>}
 */
export async function getJobTasks(jobId) {
  return dashFetch(`/jobs/${jobId}/tasks`);
}

// ─── Write operations (approval-gated) ───────────────────────────────────────

/**
 * Append a CRM note to a job in Dash.
 * POLICY: Only call this from post-dash-notes after explicit approval.
 *
 * @param {string} jobId
 * @param {string} noteBody - The note text (Dash-ready first-person PM voice).
 * @returns {Promise<{noteId: string}>}
 */
export async function postNote(jobId, noteBody) {
  return dashFetch(`/jobs/${jobId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body: noteBody, type: 'CRM' }),
  });
}

// ─── Stale-communication detection ───────────────────────────────────────────
const STALE_HOURS = 48;

/**
 * Return true if `isoTimestamp` is older than 48 hours from now.
 *
 * @param {string|null} isoTimestamp
 * @returns {boolean}
 */
export function isStale(isoTimestamp) {
  if (!isoTimestamp) return true;
  const ms = Date.now() - new Date(isoTimestamp).getTime();
  return ms > STALE_HOURS * 60 * 60 * 1000;
}

// ─── Stage helpers ────────────────────────────────────────────────────────────
export const STAGES = [
  'Pending Sale',
  'Pre-Production',
  'WIP',
  'Invoice Pending',
  'A/R',
  'Closeout',
];

/**
 * Return the required document checklist for a job type.
 *
 * @param {string} jobType - e.g. "Recon", "Water", "Fire", "Mold", "Contents", "Duct"
 * @returns {string[]}
 */
export function requiredDocs(jobType) {
  const base = [
    'Contract',
    'Work Authorization',
    'Material Selection Form',
    'Budget',
    'Certificate of Satisfaction (COS)',
    'Lien Waiver',
  ];
  const extras = {
    Recon:    ['Change Order', 'Punch List', 'Layout'],
    Mold:     ['Mold Protocol', 'Clearance Docs'],
    Water:    ['Moisture Readings', 'Drying Logs', 'Equipment Placement'],
    Fire:     ['Scope of Loss', 'Smoke/Char Documentation'],
    Contents: ['Contents Inventory / Pack-Out List'],
    Duct:     ['Pre/Post Duct Inspection Docs'],
    Insurance:['Carrier Estimate', 'Supplement Requests', 'ITEL Report', 'Claim Correspondence'],
  };
  return [...base, ...(extras[jobType] || [])];
}
