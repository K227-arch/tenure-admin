import { db } from '@/lib/db';
import { kycVerification, users } from '@/lib/db/schema';
import { sumsubClient } from './client';
import { eq, and } from 'drizzle-orm';

export interface KYCInitiationResult {
  success: boolean;
  accessToken?: string;
  applicantId?: string;
  error?: string;
}

export interface KYCStatusUpdate {
  applicantId: string;
  status: string;
  reviewResult?: any;
  score?: number;
  webhookData?: any;
}

export class SumsubService {
  /**
   * Initiate KYC process for a user
   */
  async initiateKYC(
    userId: string,
    userInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      country?: string;
    }
  ): Promise<KYCInitiationResult> {
    try {
      // Check if user exists
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        return { success: false, error: 'User not found' };
      }

      const userData = user[0];
      const externalUserId = `user_${userId}`;

      // Check if KYC already exists for this user
      const existingKyc = await db
        .select()
        .from(kycVerification)
        .where(eq(kycVerification.userId, userId))
        .limit(1);

      let applicantId: string;
      let accessToken: string;

      if (existingKyc.length > 0 && existingKyc[0].sumsubApplicantId) {
        // Use existing applicant
        applicantId = existingKyc[0].sumsubApplicantId;
        
        // Generate new access token
        const tokenResult = await sumsubClient.generateAccessToken(externalUserId);
        accessToken = tokenResult.token;

        // Update existing record with new access token
        await db
          .update(kycVerification)
          .set({
            sumsubAccessToken: accessToken,
            updatedAt: new Date(),
          })
          .where(eq(kycVerification.id, existingKyc[0].id));
      } else {
        // Create new applicant in Sumsub
        const applicant = await sumsubClient.createApplicant(
          externalUserId,
          process.env.SUMSUB_LEVEL_NAME,
          {
            firstName: userInfo?.firstName || userData.name?.split(' ')[0],
            lastName: userInfo?.lastName || userData.name?.split(' ').slice(1).join(' '),
            email: userInfo?.email || userData.email,
            phone: userInfo?.phone,
            country: userInfo?.country,
          }
        );

        applicantId = applicant.id;

        // Generate access token
        const tokenResult = await sumsubClient.generateAccessToken(externalUserId);
        accessToken = tokenResult.token;

        if (existingKyc.length > 0) {
          // Update existing record
          await db
            .update(kycVerification)
            .set({
              sumsubApplicantId: applicantId,
              sumsubExternalUserId: externalUserId,
              sumsubAccessToken: accessToken,
              status: 'pending',
              updatedAt: new Date(),
            })
            .where(eq(kycVerification.id, existingKyc[0].id));
        } else {
          // Create new KYC record
          await db.insert(kycVerification).values({
            userId,
            sumsubApplicantId: applicantId,
            sumsubExternalUserId: externalUserId,
            sumsubAccessToken: accessToken,
            status: 'pending',
            riskLevel: 'low',
            submittedAt: new Date(),
          });
        }
      }

      return {
        success: true,
        accessToken,
        applicantId,
      };
    } catch (error) {
      console.error('KYC initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get KYC status for a user
   */
  async getKYCStatus(userId: string): Promise<any> {
    try {
      const kycRecord = await db
        .select()
        .from(kycVerification)
        .where(eq(kycVerification.userId, userId))
        .limit(1);

      if (kycRecord.length === 0) {
        return { status: 'not_started' };
      }

      const record = kycRecord[0];

      if (record.sumsubApplicantId) {
        // Get latest status from Sumsub
        try {
          const applicantStatus = await sumsubClient.getApplicantStatus(record.sumsubApplicantId);
          
          // Update local record if status changed
          if (applicantStatus.reviewStatus !== record.status) {
            await this.updateKYCStatus({
              applicantId: record.sumsubApplicantId,
              status: applicantStatus.reviewStatus,
              reviewResult: applicantStatus.reviewResult,
            });
          }

          return {
            ...record,
            sumsubStatus: applicantStatus,
          };
        } catch (error) {
          console.error('Error fetching Sumsub status:', error);
          return record;
        }
      }

      return record;
    } catch (error) {
      console.error('Error getting KYC status:', error);
      throw error;
    }
  }

  /**
   * Update KYC status (typically called from webhook)
   */
  async updateKYCStatus(update: KYCStatusUpdate): Promise<void> {
    try {
      const { applicantId, status, reviewResult, score, webhookData } = update;

      await db
        .update(kycVerification)
        .set({
          status,
          reviewedAt: new Date(),
          sumsubReviewResult: reviewResult,
          sumsubScore: score?.toString(),
          sumsubWebhookData: webhookData,
          updatedAt: new Date(),
        })
        .where(eq(kycVerification.sumsubApplicantId, applicantId));

      console.log(`KYC status updated for applicant ${applicantId}: ${status}`);
    } catch (error) {
      console.error('Error updating KYC status:', error);
      throw error;
    }
  }

  /**
   * Reset KYC for resubmission
   */
  async resetKYC(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const kycRecord = await db
        .select()
        .from(kycVerification)
        .where(eq(kycVerification.userId, userId))
        .limit(1);

      if (kycRecord.length === 0 || !kycRecord[0].sumsubApplicantId) {
        return { success: false, error: 'No KYC record found' };
      }

      const record = kycRecord[0];

      // Reset in Sumsub
      await sumsubClient.resetApplicant(record.sumsubApplicantId);

      // Update local record
      await db
        .update(kycVerification)
        .set({
          status: 'pending',
          reviewedAt: null,
          sumsubReviewResult: null,
          sumsubScore: null,
          notes: null,
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(kycVerification.id, record.id));

      return { success: true };
    } catch (error) {
      console.error('Error resetting KYC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all KYC records with Sumsub data
   */
  async getAllKYCRecords(filters?: { status?: string; limit?: number; offset?: number }) {
    try {
      let query = db
        .select({
          id: kycVerification.id,
          userId: kycVerification.userId,
          status: kycVerification.status,
          riskLevel: kycVerification.riskLevel,
          submittedAt: kycVerification.submittedAt,
          reviewedAt: kycVerification.reviewedAt,
          sumsubApplicantId: kycVerification.sumsubApplicantId,
          sumsubScore: kycVerification.sumsubScore,
          sumsubReviewResult: kycVerification.sumsubReviewResult,
          userName: users.name,
          userEmail: users.email,
        })
        .from(kycVerification)
        .leftJoin(users, eq(kycVerification.userId, users.id));

      if (filters?.status && filters.status !== 'all') {
        query = query.where(eq(kycVerification.status, filters.status));
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      return await query;
    } catch (error) {
      console.error('Error getting KYC records:', error);
      throw error;
    }
  }
}

export const sumsubService = new SumsubService();