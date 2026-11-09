// WhatsApp absence-alert hook — LOG MODE by default.
// ---------------------------------------------------------------------------
// Why log mode? Sending real WhatsApp messages needs a provider account
// (Meta WhatsApp Cloud API, or a gateway) plus credentials. This module is the
// single integration point: when a provider is chosen, only this file changes
// and every call site (routes/attendance.js) keeps working untouched.
//
// Behaviour:
//   WHATSAPP_ENABLED != 'true'  -> message is logged to console, nothing sent.
//   WHATSAPP_ENABLED == 'true'  -> provider branch below. Until a provider is
//                                  wired in, it logs a warning and reports
//                                  sent:false so no alert is ever "lost silently".
// ---------------------------------------------------------------------------
async function sendAbsenceAlert({ parentPhone, parentName, studentName, className, dateLabel }) {
  const message =
    `ClassTrack absence alert: ${studentName} (${className}) was marked absent on ${dateLabel}. ` +
    `Please contact the school if this is unexpected.`;

  if (process.env.WHATSAPP_ENABLED !== 'true') {
    console.log(`[whatsapp:log-mode] To ${parentPhone || '(no number)'}: ${message}`);
    return { sent: false, mode: 'log' };
  }

  // TODO: wire a provider here once Amaar chooses one (see NOTES.md).
  // Example shape for Meta WhatsApp Cloud API (NOT active):
  //   POST https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages
  //   with WHATSAPP_ACCESS_TOKEN, body { messaging_product: 'whatsapp', to: parentPhone, type: 'text', text: { body: message } }
  console.warn(
    `[whatsapp:unconfigured] WHATSAPP_ENABLED=true but no provider is wired in. ` +
      `Message NOT sent to ${parentPhone}: ${message}`
  );
  return { sent: false, mode: 'unconfigured' };
}

module.exports = { sendAbsenceAlert };
