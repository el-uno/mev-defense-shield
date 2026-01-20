// Chrome extension storage wrapper
export const chromeStorage = {
  async get(key, shared = false) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (result[key]) {
          resolve({ key, value: result[key], shared });
        } else {
          resolve(null);
        }
      });
    });
  },

  async set(key, value, shared = false) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve({ key, value, shared });
      });
    });
  },

  async delete(key, shared = false) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve({ key, deleted: true, shared });
      });
    });
  },

  async list(prefix = '', shared = false) {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        const keys = Object.keys(items).filter(k => k.startsWith(prefix));
        resolve({ keys, prefix, shared });
      });
    });
  }
};