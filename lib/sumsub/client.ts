import crypto from 'crypto';

export interface SumsubConfig {
  appToken: string;
  secretKey: string;
  baseUrl: string;
  levelName: string;
}

export interface SumsubApplicant {
  id: string;
  externalUserId: string;
  info: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  review?: {
    reviewStatus: string;
    reviewResult: {
      reviewAnswer: string;
      rejectLabels?: string[];
      reviewRejectType?: string;
    };
  };
}

export interface SumsubAccessToken {
  token: string;
  userId: string;
}

export class SumsubClient {
  private config: SumsubConfig;

  constructor(config: SumsubConfig) {
    this.config = config;
  }

  /**
   * Generate request signature for Sumsub API authentication
   */
  private generateSignature(
    method: string,
    url: string,
    timestamp: number,
    body?: string
  ): string {
    const data = timestamp + method.toUpperCase() + url + (body || '');
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(data)
      .digest('hex')
      .toLowerCase();
  }

  /**
   * Make authenticated request to Sumsub API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = endpoint;
    const bodyString = body ? JSON.stringify(body) : '';
    
    const signature = this.generateSignature(method, url, timestamp, bodyString);

    const headers: Record<string, string> = {
      'X-App-Token': this.config.appToken,
      'X-App-Access-Sig': signature,
      'X-App-Access-Ts': timestamp.toString(),
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method,
      headers,
      body: bodyString || undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sumsub API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Create a new applicant in Sumsub
   */
  async createApplicant(
    externalUserId: string,
    levelName?: string,
    info?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      country?: string;
    }
  ): Promise<SumsubApplicant> {
    const body = {
      externalUserId,
      info: info || {},
    };

    const queryParams = levelName ? `?levelName=${levelName}` : '';
    return this.makeRequest('POST', `/resources/applicants${queryParams}`, body);
  }

  /**
   * Get applicant information
   */
  async getApplicant(applicantId: string): Promise<SumsubApplicant> {
    return this.makeRequest('GET', `/resources/applicants/${applicantId}/one`);
  }

  /**
   * Generate access token for WebSDK
   */
  async generateAccessToken(
    externalUserId: string,
    levelName?: string,
    ttlInSecs: number = 600
  ): Promise<SumsubAccessToken> {
    const level = levelName || this.config.levelName;
    const endpoint = `/resources/accessTokens?userId=${externalUserId}&levelName=${level}&ttlInSecs=${ttlInSecs}`;
    
    const result = await this.makeRequest('POST', endpoint);
    return {
      token: result.token,
      userId: externalUserId,
    };
  }

  /**
   * Get applicant status
   */
  async getApplicantStatus(applicantId: string): Promise<any> {
    return this.makeRequest('GET', `/resources/applicants/${applicantId}/status`);
  }

  /**
   * Reset applicant (for resubmission)
   */
  async resetApplicant(applicantId: string): Promise<any> {
    return this.makeRequest('POST', `/resources/applicants/${applicantId}/reset`);
  }

  /**
   * Get inspection info
   */
  async getInspectionInfo(inspectionId: string): Promise<any> {
    return this.makeRequest('GET', `/resources/inspections/${inspectionId}`);
  }

  /**
   * Test basic connectivity (simple endpoint)
   */
  async testConnection(): Promise<any> {
    // Use the simplest possible endpoint for testing
    return this.makeRequest('GET', '/resources/applicants?limit=1');
  }

  /**
   * Get all applicants with pagination
   */
  async getAllApplicants(params?: {
    limit?: number;
    offset?: number;
    levelName?: string;
    createdAtGte?: string;
    createdAtLt?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.levelName) queryParams.append('levelName', params.levelName);
    if (params?.createdAtGte) queryParams.append('createdAtGte', params.createdAtGte);
    if (params?.createdAtLt) queryParams.append('createdAtLt', params.createdAtLt);

    const endpoint = `/resources/applicants?${queryParams.toString()}`;
    return this.makeRequest('GET', endpoint);
  }

  /**
   * Get applicant documents
   */
  async getApplicantDocuments(applicantId: string): Promise<any> {
    return this.makeRequest('GET', `/resources/applicants/${applicantId}/info/idDoc`);
  }

  /**
   * Get document image
   */
  async getDocumentImage(inspectionId: string, imageId: string): Promise<any> {
    return this.makeRequest('GET', `/resources/inspections/${inspectionId}/resources/${imageId}`);
  }

  /**
   * Get applicant by external user ID
   */
  async getApplicantByExternalUserId(externalUserId: string): Promise<any> {
    return this.makeRequest('GET', `/resources/applicants/-;externalUserId=${externalUserId}/one`);
  }

  /**
   * Get verification steps for applicant
   */
  async getVerificationSteps(applicantId: string): Promise<any> {
    return this.makeRequest('GET', `/resources/applicants/${applicantId}/requiredIdDocsStatus`);
  }

  /**
   * Get applicant check results
   */
  async getCheckResults(applicantId: string): Promise<any> {
    return this.makeRequest('GET', `/resources/checks/latest?applicantId=${applicantId}`);
  }

  /**
   * Get statistics for a date range
   */
  async getStatistics(params: {
    from: string; // YYYY-MM-DD format
    to: string;   // YYYY-MM-DD format
    levelName?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    
    if (params.levelName) {
      queryParams.append('levelName', params.levelName);
    }

    return this.makeRequest('GET', `/resources/statistics?${queryParams.toString()}`);
  }

  /**
   * Search applicants by various criteria
   */
  async searchApplicants(params: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    externalUserId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.makeRequest('GET', `/resources/applicants?${queryParams.toString()}`);
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(params?: {
    limit?: number;
    offset?: number;
    from?: string;
    to?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    return this.makeRequest('GET', `/resources/webhooks/logs?${queryParams.toString()}`);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .toLowerCase();
    
    return signature.toLowerCase() === expectedSignature;
  }
}

// Create singleton instance
const sumsubConfig: SumsubConfig = {
  appToken: process.env.SUMSUB_APP_TOKEN || '',
  secretKey: process.env.SUMSUB_SECRET_KEY || '',
  baseUrl: process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com',
  levelName: process.env.SUMSUB_LEVEL_NAME || 'basic-kyc-level',
};

export const sumsubClient = new SumsubClient(sumsubConfig);