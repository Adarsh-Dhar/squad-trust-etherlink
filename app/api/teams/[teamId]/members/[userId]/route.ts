// DELETE /teams/:teamId/members/:userId
// PATCH /teams/:teamId/members/:userId (for role updates)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isTeamAdmin } from '@/lib/teams';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string, userId: string }> }) {
  try {
    const { teamId, userId } = await params;
    
    // Delete the team member
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    // Check if team should be deleted (0 members or 0 admin members)
    const remainingMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
    });

    const totalMembers = remainingMembers.length;
    const adminMembers = remainingMembers.filter(member => member.role === 'ADMIN').length;

    if (totalMembers === 0 || adminMembers === 0) {
      // Get team with all related data for deletion
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: true,
          projects: true,
        },
      });

      if (team) {
        // Use a transaction to ensure all related records are deleted
        await prisma.$transaction(async (tx) => {
          // Delete all team members first
          await tx.teamMember.deleteMany({
            where: { teamId }
          });

          // Delete all projects and their related data
          for (const project of team.projects) {
            // Delete funding records
            await tx.funding.deleteMany({
              where: { projectId: project.id }
            });
            
            // Delete contributor roles
            await tx.contributorRole.deleteMany({
              where: { projectId: project.id }
            });
            
            // Delete milestones and their signatures
            const milestones = await tx.milestone.findMany({
              where: { projectId: project.id }
            });
            
            for (const milestone of milestones) {
              // Delete milestone signatures
              await tx.taskSignature.deleteMany({
                where: { milestoneId: milestone.id }
              });
              
              // Delete milestone verifications
              await tx.milestoneVerification.deleteMany({
                where: { milestoneId: milestone.id }
              });
            }
            
            // Delete milestones
            await tx.milestone.deleteMany({
              where: { projectId: project.id }
            });
            
            // Delete project signatures
            await tx.projectSignature.deleteMany({
              where: { projectId: project.id }
            });
            
            // Delete investor signatures
            await tx.investorSignature.deleteMany({
              where: { projectId: project.id }
            });
          }
          
          // Delete projects
          await tx.project.deleteMany({
            where: { teamId }
          });
          
          // Delete credibility score
          await tx.credibilityScore.deleteMany({
            where: { teamId }
          });
          
          // Finally, delete the team
          await tx.team.delete({
            where: { id: teamId }
          });
        });
      }
    }

    return NextResponse.json({ message: `User ${userId} removed from team ${teamId}.` });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to remove member.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string, userId: string }> }) {
  try {
    const { teamId, userId } = await params;
    const { role, updatedBy } = await req.json();

    if (!role || !updatedBy) {
      return NextResponse.json({ error: 'Role and updatedBy are required.' }, { status: 400 });
    }

    // Check if the updater is an admin
    const isUpdaterAdmin = await isTeamAdmin(teamId, updatedBy);
    if (!isUpdaterAdmin) {
      return NextResponse.json({ error: 'Only admins can update member roles.' }, { status: 403 });
    }

    // Prevent admins from demoting themselves (at least one admin must remain)
    if (userId === updatedBy && role === 'MEMBER') {
      const adminCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last admin. At least one admin must remain.' }, { status: 400 });
      }
    }

    const updatedMember = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        role,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      message: `User ${userId} role updated to ${role}.`,
      member: updatedMember,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update member role.' }, { status: 500 });
  }
} 