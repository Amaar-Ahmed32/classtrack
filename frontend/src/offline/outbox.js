// IndexedDB outbox: the offline queue for attendance saves.
// When the teacher is offline (or a save fails with a network error), the
// attendance payload is stored here instead of being lost. sync.js drains the
// queue when connectivity returns. Plain IndexedDB — no library — so the
// mechanism is small enough to explain in a viva.
//
// STUB NOTE: the queue stores payloads and syncs them; conflict handling is
// last-write-wins (a later save of the same class+date overwrites the earlier
// one server-side via the upsert). No merge UI exists yet — see NOTES.md.
const DB_NAME = 'classtrack';
const STORE = 'outbox';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const result = fn(store);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

function notify() {
  // Lets the nav badge update without a state library.
  window.dispatchEvent(new Event('outbox-changed'));
}

export async function queueAttendance(payload) {
  await run('readwrite', (store) =>
    store.add({ type: 'attendance', payload, createdAt: new Date().toISOString() })
  );
  notify();
}

export async function getQueued() {
  return run('readonly', (store) => {
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function removeQueued(id) {
  await run('readwrite', (store) => store.delete(id));
  notify();
}

export async function countQueued() {
  const items = await getQueued();
  return items.length;
}
