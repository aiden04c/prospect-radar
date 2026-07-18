// Mimics the Claude artifact window.storage API using the browser's
// localStorage, so ProspectRadar.jsx needs zero storage changes.
// Note: data lives per-browser, per-device (no sync between devices).
window.storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    if (v === null) throw new Error("key not found: " + key); // matches artifact behaviour
    return { key, value: v, shared: false };
  },
  async set(key, value) {
    localStorage.setItem(key, String(value));
    return { key, value: String(value), shared: false };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix = "") {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    return { keys, prefix, shared: false };
  },
};
