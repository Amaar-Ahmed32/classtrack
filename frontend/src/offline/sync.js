// Sync worker: drains the IndexedDB outbox into the API.
// Called on app start and on the browser 'online' event (see main.jsx).
// STUB NOTE: this is the real drain loop — each queued payload is POSTed in
// order and removed on success. Failures stay queued for the next attempt.
// What is NOT built yet: a visible "syncing…" state and a conflict-resolution UI
// (server upsert = last-write-wins, which is correct for a single teacher
// marking their own register).
import { getQueued, removeQueued } from './outbox';
import { api } from '../api';

let syncing = false;

export async function syncOutbox() {
  if (syncing || !navigator.onLine) return 0;
  syncing = true;
  let synced = 0;
  try {
    const items = await getQueued();
    for (const item of items) {
      try {
        if (item.type === 'attendance') {
          await api.attendance.saveDay(item.payload);
        } else {
          continue; // unknown item type — leave it queued, do not delete
        }
        await removeQueued(item.id);
        synced += 1;
      } catch (e) {
        // Network still down or server error: stop here, retry everything later.
        console.warn('Outbox sync paused:', e.message);
        break;
      }
    }
  } finally {
    syncing = false;
  }
  if (synced > 0) window.dispatchEvent(new Event('outbox-synced'));
  return synced;
}
