const PREFIX = "journal-draft-";

export function purgeOldDrafts(days = 14) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const match = key.match(/^journal-draft-(?:.+-)?(\d+)-/);
    if (match) {
      const ts = Number(match[1]);
      if (!Number.isNaN(ts) && ts < cutoff) {
        localStorage.removeItem(key);
      }
    }
  }
}
