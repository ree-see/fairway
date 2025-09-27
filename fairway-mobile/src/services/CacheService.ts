import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class CacheService {
  private cacheKeyPrefix = '@fairway_cache:';

  /**
   * Store data in cache with expiration
   */
  async set<T>(key: string, data: T, expiresInMinutes: number = 30): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expiresInMinutes * 60 * 1000, // convert to milliseconds
      };

      await AsyncStorage.setItem(
        this.getCacheKey(key),
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Get data from cache, returns null if expired or not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedValue = await AsyncStorage.getItem(this.getCacheKey(key));
      
      if (!cachedValue) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cachedValue);
      const now = Date.now();
      
      // Check if cache has expired
      if (now - cacheItem.timestamp > cacheItem.expiresIn) {
        // Remove expired cache
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getCacheKey(key));
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKeyPrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache size info
   */
  async getCacheInfo(): Promise<{ totalKeys: number; cacheKeys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKeyPrefix));
      
      return {
        totalKeys: keys.length,
        cacheKeys: cacheKeys.map(key => key.replace(this.cacheKeyPrefix, '')),
      };
    } catch (error) {
      console.warn('Cache info error:', error);
      return { totalKeys: 0, cacheKeys: [] };
    }
  }

  /**
   * Check if cache key exists and is valid
   */
  async isValid(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Get or set pattern - if cache exists and valid, return it, otherwise fetch and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    expiresInMinutes: number = 30
  ): Promise<T> {
    // Try to get from cache first
    const cachedData = await this.get<T>(key);
    
    if (cachedData !== null) {
      return cachedData;
    }

    // Cache miss - fetch new data
    const freshData = await fetchFunction();
    
    // Store in cache
    await this.set(key, freshData, expiresInMinutes);
    
    return freshData;
  }

  private getCacheKey(key: string): string {
    return `${this.cacheKeyPrefix}${key}`;
  }
}

// Export singleton instance
export default new CacheService();