import { prisma } from '@/lib/prisma';
import { DisputeStatus } from '@prisma/client';

export interface DisputeResolutionConfig {
  autoResolveDays: number;
  autoIgnoreDays: number;
  checkIntervalHours: number;
}

export interface DisputeStats {
  total: number;
  pending: number;
  resolved: number;
  rejected: number;
  autoResolved: number;
  autoIgnored: number;
}

export class DisputeResolutionSystem {
  private config: DisputeResolutionConfig;

  constructor(config: Partial<DisputeResolutionConfig> = {}) {
    this.config = {
      autoResolveDays: 14,
      autoIgnoreDays: 14,
      checkIntervalHours: 24,
      ...config,
    };
  }

  /**
   * Get all disputes with optional filtering
   */
  async getDisputes(options: {
    status?: DisputeStatus;
    limit?: number;
    offset?: number;
    includeExpired?: boolean;
  } = {}) {
    const { status, limit, offset, includeExpired = false } = options;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (!includeExpired) {
      // Exclude disputes that are older than autoIgnoreDays
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.autoIgnoreDays);
      where.createdAt = {
        gte: cutoffDate,
      };
    }

    return await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(): Promise<DisputeStats> {
    const [
      total,
      pending,
      resolved,
      rejected,
      autoResolved,
      autoIgnored,
    ] = await Promise.all([
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: 'PENDING' } }),
      prisma.dispute.count({ where: { status: 'RESOLVED' } }),
      prisma.dispute.count({ where: { status: 'REJECTED' } }),
      prisma.dispute.count({ 
        where: { 
          status: 'RESOLVED',
          updatedAt: {
            gte: new Date(Date.now() - this.config.autoResolveDays * 24 * 60 * 60 * 1000)
          }
        } 
      }),
      prisma.dispute.count({ 
        where: { 
          status: 'PENDING',
          createdAt: {
            lt: new Date(Date.now() - this.config.autoIgnoreDays * 24 * 60 * 60 * 1000)
          }
        } 
      }),
    ]);

    return {
      total,
      pending,
      resolved,
      rejected,
      autoResolved,
      autoIgnored,
    };
  }

  /**
   * Create a new dispute
   */
  async createDispute(data: {
    title: string;
    description: string;
  }) {
    return await prisma.dispute.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  /**
   * Manually resolve a dispute
   */
  async resolveDispute(id: string, resolution?: string) {
    return await prisma.dispute.update({
      where: { id },
      data: { 
        status: 'RESOLVED',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Manually reject a dispute
   */
  async rejectDispute(id: string, reason?: string) {
    return await prisma.dispute.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Auto-resolve disputes that are older than autoResolveDays
   */
  async autoResolveExpiredDisputes() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.autoResolveDays);

    const expiredDisputes = await prisma.dispute.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (expiredDisputes.length === 0) {
      return { resolved: 0, message: 'No expired disputes to auto-resolve' };
    }

    const updatePromises = expiredDisputes.map(dispute =>
      prisma.dispute.update({
        where: { id: dispute.id },
        data: { 
          status: 'RESOLVED',
          updatedAt: new Date(),
        },
      })
    );

    const resolvedDisputes = await Promise.all(updatePromises);

    return {
      resolved: resolvedDisputes.length,
      disputes: resolvedDisputes,
      message: `Auto-resolved ${resolvedDisputes.length} expired disputes`,
    };
  }

  /**
   * Auto-ignore disputes that are older than autoIgnoreDays
   */
  async autoIgnoreExpiredDisputes() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.autoIgnoreDays);

    const expiredDisputes = await prisma.dispute.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (expiredDisputes.length === 0) {
      return { ignored: 0, message: 'No expired disputes to auto-ignore' };
    }

    const updatePromises = expiredDisputes.map(dispute =>
      prisma.dispute.update({
        where: { id: dispute.id },
        data: { 
          status: 'REJECTED',
          updatedAt: new Date(),
        },
      })
    );

    const ignoredDisputes = await Promise.all(updatePromises);

    return {
      ignored: ignoredDisputes.length,
      disputes: ignoredDisputes,
      message: `Auto-ignored ${ignoredDisputes.length} expired disputes`,
    };
  }

  /**
   * Get disputes that are approaching expiration
   */
  async getExpiringDisputes(warningDays: number = 3) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() - (this.config.autoResolveDays - warningDays));

    return await prisma.dispute.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: warningDate,
          lt: new Date(warningDate.getTime() + warningDays * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(id: string) {
    return await prisma.dispute.findUnique({
      where: { id },
    });
  }

  /**
   * Get disputes by status
   */
  async getDisputesByStatus(status: DisputeStatus) {
    return await prisma.dispute.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get disputes created within a date range
   */
  async getDisputesByDateRange(startDate: Date, endDate: Date) {
    return await prisma.dispute.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a dispute (admin only)
   */
  async deleteDispute(id: string) {
    return await prisma.dispute.delete({
      where: { id },
    });
  }

  /**
   * Get system configuration
   */
  getConfig(): DisputeResolutionConfig {
    return { ...this.config };
  }

  /**
   * Update system configuration
   */
  updateConfig(newConfig: Partial<DisputeResolutionConfig>) {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }
}

// Export default instance
export const disputeSystem = new DisputeResolutionSystem();

// Export utility functions
export const disputeUtils = {
  /**
   * Check if a dispute is expired
   */
  isExpired: (dispute: any, days: number = 14): boolean => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return new Date(dispute.createdAt) < cutoffDate;
  },

  /**
   * Get days until dispute expires
   */
  getDaysUntilExpiry: (dispute: any, days: number = 14): number => {
    const expiryDate = new Date(dispute.createdAt);
    expiryDate.setDate(expiryDate.getDate() + days);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Format dispute age
   */
  formatDisputeAge: (createdAt: Date): string => {
    const now = new Date();
    const diffTime = now.getTime() - new Date(createdAt).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  },
};
