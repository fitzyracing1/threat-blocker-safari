// IP Geolocation Service
import { IPLocation } from '../types';

export class GeolocationService {
  private cache: Map<string, IPLocation> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get IP geolocation data using ipapi.co free API
   * Limit: 1000 requests per day for free tier
   */
  async getIPLocation(ip: string): Promise<IPLocation | undefined> {
    // Check cache first
    const cached = this.cache.get(ip);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      
      if (!response.ok) {
        console.warn(`Geolocation API error: ${response.status}`);
        return undefined;
      }

      const data = await response.json();

      // Handle rate limiting
      if (data.error) {
        console.warn('Geolocation API limit reached or error:', data.reason);
        return undefined;
      }

      const location: IPLocation = {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        countryCode: data.country_code,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        isp: data.org,
        org: data.org,
        asn: data.asn
      };

      // Cache the result
      this.cache.set(ip, location);

      // Clear old cache entries periodically
      setTimeout(() => this.cache.delete(ip), this.CACHE_DURATION);

      return location;
    } catch (error) {
      console.error('Error fetching IP geolocation:', error);
      return undefined;
    }
  }

  /**
   * Extract IP address from URL (fallback method)
   */
  extractIPFromURL(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Check if hostname is an IP address
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(hostname)) {
        return hostname;
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get multiple IP locations in batch
   */
  async getBatchLocations(ips: string[]): Promise<Map<string, IPLocation>> {
    const results = new Map<string, IPLocation>();
    
    // Process in batches to avoid rate limiting
    for (const ip of ips) {
      const location = await this.getIPLocation(ip);
      if (location) {
        results.set(ip, location);
      }
      
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Clear the geolocation cache
   */
  clearCache() {
    this.cache.clear();
  }
}
