// lib/google-workspace.js
// Thin wrappers around Google Workspace APIs used across all SERVPRO workflows.
// Auth: Google service account (GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON) with
//       domain-wide delegation impersonating GOOGLE_IMPERSONATED_USER.

import { google } from 'googleapis';

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAuth(scopes) {
  const saJson = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON;
  const user   = process.env.GOOGLE_IMPERSONATED_USER;

  if (!saJson || !user) {
    throw new Error(
      'GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON and GOOGLE_IMPERSONATED_USER ' +
      'must be set in your .env file.'
    );
  }

  const credentials = JSON.parse(saJson);
  return new google.auth.JWT({
    email:   credentials.client_email,
    key:     credentials.private_key,
    scopes,
    subject: user,
  });
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

/**
 * Create a Gmail draft (does NOT send).
 *
 * @param {{to: string, subject: string, body: string}} opts
 * @returns {Promise<{draftId: string, threadId: string}>}
 */
export async function createGmailDraft({ to, subject, body }) {
  const auth  = getAuth(['https://www.googleapis.com/auth/gmail.compose']);
  const gmail = google.gmail({ version: 'v1', auth });

  // Build a minimal RFC 2822 message.
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).toString('base64url');

  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw } },
  });
  return { draftId: res.data.id, threadId: res.data.message?.threadId };
}

/**
 * Apply a label to a Gmail thread.
 *
 * @param {string} threadId
 * @param {string} labelName - e.g. "Work in Progress", "A/R", "Pending Sale"
 */
export async function applyGmailLabel(threadId, labelName) {
  const auth  = getAuth(['https://www.googleapis.com/auth/gmail.modify']);
  const gmail = google.gmail({ version: 'v1', auth });

  // Resolve label name → ID (create if missing — but never duplicate).
  const labelsRes = await gmail.users.labels.list({ userId: 'me' });
  let label = labelsRes.data.labels?.find(l => l.name === labelName);
  if (!label) {
    const createRes = await gmail.users.labels.create({
      userId: 'me',
      requestBody: { name: labelName, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
    });
    label = createRes.data;
  }

  await gmail.users.threads.modify({
    userId: 'me',
    id: threadId,
    requestBody: { addLabelIds: [label.id] },
  });
}

// ─── Google Calendar ──────────────────────────────────────────────────────────

/**
 * Create a Calendar event draft (inserts but does NOT notify attendees unless
 * sendUpdates is set to 'all' by the caller).
 *
 * @param {{
 *   summary: string,
 *   description: string,
 *   start: string,
 *   end: string,
 *   colorId?: string,
 *   location?: string
 * }} opts
 * @returns {Promise<{eventId: string, htmlLink: string}>}
 */
export async function createCalendarEvent({ summary, description, start, end, colorId, location }) {
  const auth     = getAuth(['https://www.googleapis.com/auth/calendar']);
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'none',
    requestBody: {
      summary,
      description,
      location,
      colorId,
      start: { dateTime: start, timeZone: 'America/Chicago' },
      end:   { dateTime: end,   timeZone: 'America/Chicago' },
    },
  });
  return { eventId: res.data.id, htmlLink: res.data.htmlLink };
}

// ─── Google Drive ─────────────────────────────────────────────────────────────

/**
 * Create a Google Doc in a Drive folder.
 *
 * @param {{title: string, content: string, folderId: string}} opts
 * @returns {Promise<{docId: string, url: string}>}
 */
export async function createDriveDoc({ title, content, folderId }) {
  const auth  = getAuth([
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
  ]);
  const docs  = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  // Create the Doc.
  const doc = await docs.documents.create({ requestBody: { title } });
  const docId = doc.data.documentId;

  // Insert content.
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{ insertText: { location: { index: 1 }, text: content } }],
    },
  });

  // Move to target folder.
  const file = await drive.files.get({ fileId: docId, fields: 'parents' });
  await drive.files.update({
    fileId: docId,
    addParents: folderId,
    removeParents: (file.data.parents || []).join(','),
    fields: 'id, parents',
  });

  return { docId, url: `https://docs.google.com/document/d/${docId}/edit` };
}

// ─── Google Sheets ────────────────────────────────────────────────────────────

/**
 * Append a row to a Google Sheet.
 *
 * @param {{spreadsheetId: string, sheetName: string, values: any[]}} opts
 * @returns {Promise<void>}
 */
export async function appendSheetRow({ spreadsheetId, sheetName, values }) {
  const auth   = getAuth(['https://www.googleapis.com/auth/spreadsheets']);
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

/**
 * Read all rows from a named sheet range.
 *
 * @param {{spreadsheetId: string, range: string}} opts
 * @returns {Promise<any[][]>}
 */
export async function readSheetRange({ spreadsheetId, range }) {
  const auth   = getAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values ?? [];
}

// ─── Google Chat ──────────────────────────────────────────────────────────────

/**
 * List unread messages in a Chat space since `sinceMs` (epoch ms).
 * Requires the Chat API and a service account with Chat scope.
 *
 * @param {{spaceName: string, sinceMs: number}} opts
 * @returns {Promise<ChatMessage[]>}
 */
export async function listChatMessages({ spaceName, sinceMs }) {
  const auth = getAuth(['https://www.googleapis.com/auth/chat.messages.readonly']);
  const chat = google.chat({ version: 'v1', auth });

  const since = new Date(sinceMs).toISOString();
  const res   = await chat.spaces.messages.list({
    parent: spaceName,
    filter: `createTime > "${since}"`,
    pageSize: 100,
  });
  return res.data.messages ?? [];
}

/**
 * Send a message to a Google Chat space (DRAFT — requires approval before calling).
 *
 * @param {{spaceName: string, text: string}} opts
 * @returns {Promise<{messageName: string}>}
 */
export async function sendChatMessage({ spaceName, text }) {
  const auth = getAuth(['https://www.googleapis.com/auth/chat.messages.create']);
  const chat = google.chat({ version: 'v1', auth });

  const res = await chat.spaces.messages.create({
    parent: spaceName,
    requestBody: { text },
  });
  return { messageName: res.data.name };
}
