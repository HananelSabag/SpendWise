/**
 * Simple in-process User cache (Map-based, not the LRU cache used by
 * middleware/auth.js for request-scoped lookups — this one backs the User
 * model's own findById/findByEmail/update methods).
 * @module models/UserCache
 */

class UserCache {
  static cache = new Map();
  static TTL = 10 * 60 * 1000; // 10 minutes

  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  static set(key, data) {
    // ✅ Cleanup old entries if cache is getting large
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // ✅ Store a DEEP COPY to prevent reference corruption
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep copy via JSON
      timestamp: Date.now()
    });
  }

  static invalidate(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static clear() {
    this.cache.clear();
  }
}

module.exports = { UserCache };
