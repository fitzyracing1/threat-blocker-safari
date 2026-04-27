import { IPLocation } from '../types';
export declare class GeolocationService {
    private cache;
    private readonly CACHE_DURATION;
    /**
     * Get IP geolocation data using ipapi.co free API
     * Limit: 1000 requests per day for free tier
     */
    getIPLocation(ip: string): Promise<IPLocation | undefined>;
    /**
     * Extract IP address from URL (fallback method)
     */
    extractIPFromURL(url: string): string | undefined;
    /**
     * Get multiple IP locations in batch
     */
    getBatchLocations(ips: string[]): Promise<Map<string, IPLocation>>;
    /**
     * Clear the geolocation cache
     */
    clearCache(): void;
}
