// TTLock API Integration
// This is a placeholder implementation for TTLock API integration

interface TTLockConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

interface AccessCodeResponse {
  code: string;
  expiresAt: string;
}

class TTLockAPI {
  private config: TTLockConfig;

  constructor(config: TTLockConfig) {
    this.config = config;
  }

  async generateAccessCode(lockId: string, userId: string): Promise<AccessCodeResponse> {
    try {
      // TODO: Implement actual TTLock API call
      // This is a placeholder implementation
      
      const response = await fetch(`${this.config.baseUrl}/api/v1/access-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`,
        },
        body: JSON.stringify({
          lockId,
          userId,
          type: 'temporary',
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate access code');
      }

      const data = await response.json();
      return {
        code: data.accessCode,
        expiresAt: data.validTo,
      };
    } catch (error) {
      console.error('TTLock API Error:', error);
      
      // Return a mock code for development
      return {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  }

  async revokeAccessCode(lockId: string, codeId: string): Promise<boolean> {
    try {
      // TODO: Implement actual TTLock API call
      const response = await fetch(`${this.config.baseUrl}/api/v1/access-codes/${codeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('TTLock API Error:', error);
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      // TODO: Implement actual OAuth flow for TTLock
      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('TTLock Auth Error:', error);
      return 'mock_token_for_development';
    }
  }
}

// Export configured instance
export const ttlockAPI = new TTLockAPI({
  clientId: process.env.REACT_APP_TTLOCK_CLIENT_ID || '',
  clientSecret: process.env.REACT_APP_TTLOCK_CLIENT_SECRET || '',
  baseUrl: 'https://api.ttlock.com', // Replace with actual TTLock API URL
});

// Utility function to generate access code for a rental
export const generateRentalAccessCode = async (
  lockId: string, 
  userId: string
): Promise<string> => {
  try {
    const result = await ttlockAPI.generateAccessCode(lockId, userId);
    return result.code;
  } catch (error) {
    console.error('Failed to generate access code:', error);
    // Return a fallback code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
};