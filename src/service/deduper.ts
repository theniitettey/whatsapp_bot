const TTL_MS = 60 * 1000; // keep seen IDs for 60s
const seen = new Map<string, number>();

function cleanup() {
  const now = Date.now();
  for (const [id, ts] of seen.entries()) {
    if (now - ts > TTL_MS) seen.delete(id);
  }
}

function isProcessed(id?: string | null): boolean {
  if (!id) return false;
  cleanup();
  return seen.has(id);
}

function markProcessed(id: string) {
  if (!id) return;
  seen.set(id, Date.now());
}

export { isProcessed, markProcessed };
