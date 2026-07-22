// workflows/google-chat.js
// SERVPRO Google Chat Lead Monitoring + Crew Coordination.
// Scans Chat spaces for new leads and crew updates, routes leads into intake,
// and drafts crew messages for Tristan's review. Nothing sent until approved.

import { listChatMessages }   from '../lib/google-workspace.js';
import { generateFast }       from '../lib/gemini-client.js';
import { intakeNewLead }      from './pipeline-intake.js';

// ─── Space names — update with your actual Google Chat space resource names ──
// Format: "spaces/XXXXXXXXX"
const SPACES = {
  newLeads:    process.env.CHAT_SPACE_NEW_LEADS    || '',
  crew:        process.env.CHAT_SPACE_CREW         || '',
  customerDMs: process.env.CHAT_SPACE_CUSTOMER_DMS || '',
  management:  process.env.CHAT_SPACE_MANAGEMENT   || '',
};

// How far back to scan in milliseconds (default: last 48 hours).
const SCAN_WINDOW_HOURS_DEFAULT = parseInt(process.env.CHAT_SCAN_WINDOW_HOURS || '48', 10);
const SCAN_WINDOW_MS = SCAN_WINDOW_HOURS_DEFAULT * 3_600_000;

// ─── Lead detection ───────────────────────────────────────────────────────────

function looksLikeLead(messageText) {
  const keywords = /water|fire|mold|flood|damage|estimate|quote|insurance|loss|restoration|help|emergency/i;
  return keywords.test(messageText);
}

async function extractLeadFromMessage(messageText) {
  const prompt = `
Extract new lead details from this Google Chat message for a SERVPRO restoration company.
Return a JSON object with these fields (use null if unknown):
{ customerName, address, phone, email, causeOfLoss, notes }

Message: ${messageText}

Respond with ONLY valid JSON — no markdown fences.
`.trim();

  const raw = await generateFast(prompt);
  try {
    return JSON.parse(raw.replace(/^```json\n?|```$/g, '').trim());
  } catch {
    return { customerName: null, address: null, phone: null, email: null, causeOfLoss: null, notes: messageText };
  }
}

// ─── Crew compliance check ────────────────────────────────────────────────────

async function checkCrewPhotoCompliance(messages) {
  const recentTexts = messages.slice(0, 20).map(m => m.text?.text || '').join('\n---\n');

  const prompt = `
Review these recent Google Chat crew coordination messages and flag any crews
that have NOT submitted job site photos in the last 48 hours.
List: crew name (or sender), job they are on, last photo submission time if mentioned.
If no photo submission is mentioned for a crew, flag as "NO RECENT PHOTO".

Messages:
${recentTexts}

Output a brief compliance report.
`.trim();

  return generateFast(prompt);
}

// ─── Draft crew message ───────────────────────────────────────────────────────

async function draftCrewFollowUp(crewName, jobName, issue) {
  const prompt = `
Draft a brief, direct crew coordination message from Tristan to ${crewName} regarding ${jobName}.
Issue: ${issue}
Tone: clear, professional, action-oriented. One paragraph max.
`.trim();
  return generateFast(prompt);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Scan all Chat spaces and produce a triage report with lead intakes and crew flags.
 *
 * @returns {Promise<ChatTriageReport>}
 */
export async function runChatTriage() {
  console.log('=== SERVPRO Google Chat Triage — DRAFT MODE ===');
  const sinceMs = Date.now() - SCAN_WINDOW_MS;
  const report  = { runAt: new Date().toISOString(), newLeads: [], crewFlags: [], dmFlags: [] };

  // ── New Leads / Referrals space ──────────────────────────────────────────
  if (SPACES.newLeads) {
    console.log('Scanning New Leads space…');
    const msgs = await listChatMessages({ spaceName: SPACES.newLeads, sinceMs });
    console.log(`  ${msgs.length} message(s) found.`);

    for (const msg of msgs) {
      const text = msg.text?.text || '';
      if (looksLikeLead(text)) {
        console.log(`  Potential lead detected — running intake…`);
        const leadData = await extractLeadFromMessage(text);
        leadData.source = 'Google Chat — New Leads';
        leadData.notes  = text;

        const pkg = await intakeNewLead(leadData);
        report.newLeads.push({ messageName: msg.name, lead: leadData, intakePackage: pkg });
      }
    }
  }

  // ── Crew Coordination space ──────────────────────────────────────────────
  if (SPACES.crew) {
    console.log('Scanning Crew Coordination space…');
    const msgs = await listChatMessages({ spaceName: SPACES.crew, sinceMs });
    console.log(`  ${msgs.length} message(s) found.`);

    const complianceReport = await checkCrewPhotoCompliance(msgs);
    console.log('\nCrew Photo Compliance Report (DRAFT):');
    console.log(complianceReport);
    report.crewFlags.push({ complianceReport });
  }

  // ── Customer Direct Messages ─────────────────────────────────────────────
  if (SPACES.customerDMs) {
    console.log('Scanning Customer DMs…');
    const msgs = await listChatMessages({ spaceName: SPACES.customerDMs, sinceMs });
    if (msgs.length) {
      console.log(`  ${msgs.length} customer DM(s) requiring response.`);
      report.dmFlags.push(...msgs.map(m => ({ messageName: m.name, text: m.text?.text })));
    }
  }

  console.log('\n=== Chat Triage complete. ALL OUTPUTS ARE DRAFTS. ===');
  console.log(`New leads found : ${report.newLeads.length}`);
  console.log(`Crew flags      : ${report.crewFlags.length}`);
  console.log(`Customer DMs    : ${report.dmFlags.length}`);

  return report;
}
