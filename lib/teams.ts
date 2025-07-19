import { prisma } from '@/lib/prisma';

export interface TeamMemberWithUser {
  id: string;
  teamId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  user: {
    id: string;
    walletAddress: string;
    name: string | null;
  };
}

/**
 * Check if a user is an admin of a team
 */
export async function isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });

  return member?.role === 'ADMIN';
}

/**
 * Get all admins of a team
 */
export async function getTeamAdmins(teamId: string): Promise<TeamMemberWithUser[]> {
  return await prisma.teamMember.findMany({
    where: {
      teamId,
      role: 'ADMIN',
    },
    include: {
      user: true,
    },
  });
}

/**
 * Check if a user can perform admin actions on a team
 */
export async function canPerformAdminAction(teamId: string, userId: string): Promise<boolean> {
  return await isTeamAdmin(teamId, userId);
}

/**
 * Get team member with user details
 */
export async function getTeamMember(teamId: string, userId: string): Promise<TeamMemberWithUser | null> {
  return await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    include: {
      user: true,
    },
  });
} 