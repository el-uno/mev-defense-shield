
export const storage = {
  async get(key, shared = false) {
    try {
      const value = localStorage.getItem(shared ? `shared_${key}` : key);
      return value ? { key, value, shared } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key, value, shared = false) {
    try {
      localStorage.setItem(shared ? `shared_${key}` : key, value);
      return { key, value, shared };
    } catch (error) {
      console.error('Storage set error:', error);
      return null;
    }
  },

  async delete(key, shared = false) {
    try {
      localStorage.removeItem(shared ? `shared_${key}` : key);
      return { key, deleted: true, shared };
    } catch (error) {
      console.error('Storage delete error:', error);
      return null;
    }
  },

  async list(prefix = '', shared = false) {
    try {
      const keys = [];
      const prefixToUse = shared ? `shared_${prefix}` : prefix;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefixToUse)) {
          keys.push(key);
        }
      }
      return { keys, prefix, shared };
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [], prefix, shared };
    }
  }
};