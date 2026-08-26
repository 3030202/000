// Zero-dependency Cloudflare REST API v4 Client for 000-Mission-Control

export interface CloudflareDnsRecord {
  id: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV' | 'CAA';
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked?: boolean;
  created_on?: string;
  modified_on?: string;
}

export interface CloudflareZoneDetails {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
}

export interface CloudflareApiResponse<T = any> {
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
  messages?: Array<{ code: number; message: string }>;
  result?: T;
}

export const cloudflareApi = {
  /**
   * Verify API token status and validity
   */
  async verifyToken(apiToken: string): Promise<CloudflareApiResponse<{ id: string; status: string }>> {
    const cleanToken = apiToken.trim();
    if (!cleanToken) {
      return { success: false, errors: [{ code: 400, message: 'Cloudflare API Token is empty' }] };
    }

    try {
      const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        errors: [{ code: 0, message: err?.message || 'Network error connecting to api.cloudflare.com' }]
      };
    }
  },

  /**
   * Purge entire cache for a specific Zone
   */
  async purgeAllCache(apiToken: string, zoneId: string): Promise<CloudflareApiResponse<{ id: string }>> {
    const cleanToken = apiToken.trim();
    const cleanZone = zoneId.trim();

    if (!cleanToken || !cleanZone) {
      return {
        success: false,
        errors: [{ code: 400, message: 'API Token and Zone ID are both required for Cache Purge' }]
      };
    }

    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cleanZone}/purge_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ purge_everything: true })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        errors: [{ code: 0, message: err?.message || 'Network error executing Cache Purge' }]
      };
    }
  },

  /**
   * Purge specific files / URLs from cache
   */
  async purgeFiles(apiToken: string, zoneId: string, files: string[]): Promise<CloudflareApiResponse<{ id: string }>> {
    const cleanToken = apiToken.trim();
    const cleanZone = zoneId.trim();

    if (!cleanToken || !cleanZone) {
      return {
        success: false,
        errors: [{ code: 400, message: 'API Token and Zone ID are both required' }]
      };
    }
    if (!files.length) {
      return {
        success: false,
        errors: [{ code: 400, message: 'At least one file URL is required' }]
      };
    }

    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cleanZone}/purge_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        errors: [{ code: 0, message: err?.message || 'Network error executing selective Cache Purge' }]
      };
    }
  },

  /**
   * List DNS Records for a Zone
   */
  async listDnsRecords(apiToken: string, zoneId: string): Promise<CloudflareApiResponse<CloudflareDnsRecord[]>> {
    const cleanToken = apiToken.trim();
    const cleanZone = zoneId.trim();

    if (!cleanToken || !cleanZone) {
      return {
        success: false,
        errors: [{ code: 400, message: 'API Token and Zone ID are required to list DNS records' }]
      };
    }

    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cleanZone}/dns_records?per_page=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        errors: [{ code: 0, message: err?.message || 'Network error fetching DNS records' }]
      };
    }
  },

  /**
   * Get Zone Details & Status
   */
  async getZoneDetails(apiToken: string, zoneId: string): Promise<CloudflareApiResponse<CloudflareZoneDetails>> {
    const cleanToken = apiToken.trim();
    const cleanZone = zoneId.trim();

    if (!cleanToken || !cleanZone) {
      return {
        success: false,
        errors: [{ code: 400, message: 'API Token and Zone ID are required' }]
      };
    }

    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cleanZone}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        errors: [{ code: 0, message: err?.message || 'Network error fetching Zone details' }]
      };
    }
  }
};
