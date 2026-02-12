export class SimpleTTLCache {
    constructor({ ttlMs = 300000, maxItems = 200 } = {}) {
      this.ttlMs = ttlMs;
      this.maxItems = maxItems;
      this.map = new Map();
    }
  
    get(key) {
      const item = this.map.get(key);
      if (!item) return null;
      if (Date.now() > item.expiresAt) {
        this.map.delete(key);
        return null;
      }
      this.map.delete(key);
      this.map.set(key, item);
      return item.value;
    }
  
    set(key, value) {
      if (this.map.size >= this.maxItems) {
        const oldestKey = this.map.keys().next().value;
        this.map.delete(oldestKey);
      }
      this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }
  }
  