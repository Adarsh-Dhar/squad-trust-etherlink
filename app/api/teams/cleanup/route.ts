import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TeamToDelete {
  id: string;
  name: string;
  members: any[];
  projects: any[];
}

interface DeletedTeamResult {
  teamId: string;
  teamName: string;
  totalMembers: number;
  adminMembers: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('Starting cleanup of empty teams...');
    
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        projects: true,
      },
    });

    const teamsToDelete: TeamToDelete[] = [];
    const results: DeletedTeamResult[] = [];

    teams.forEach((team) => {
      const totalMembers = team.members.length;
      const adminMembers = team.members.filter(member => member.role === 'ADMIN').length;
      
      if (totalMembers === 0 || adminMembers === 0) {
        teamsToDelete.push(team);
        results.push({
          teamId: team.id,
          teamName: team.name,
          totalMembers,
          adminMembers,
          reason: totalMembers === 0 ? '0 members' : '0 admin members'
        });
      }
    });

    if (teamsToDelete.length === 0) {
      return NextResponse.json({ 
        message: 'No teams need to be deleted.',
        deletedTeams: []
      });
    }

    console.log(`Found ${teamsToDelete.length} teams to delete`);

    for (const team of teamsToDelete) {
      console.log(`Deleting team: ${team.name}...`);
      
      // Use a transaction to ensure all related records are deleted
      await prisma.$transaction(async (tx) => {
        // Delete all team members first
        await tx.teamMember.deleteMany({
          where: { teamId: team.id }
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
          where: { teamId: team.id }
        });
        
        // Delete credibility score
        await tx.credibilityScore.deleteMany({
          where: { teamId: team.id }
        });
        
        // Finally, delete the team
        await tx.team.delete({
          where: { id: team.id }
        });
      });
      
      console.log(`✅ Deleted team: ${team.name}`);
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${teamsToDelete.length} teams.`,
      deletedTeams: results
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Failed to cleanup teams.' }, { status: 500 });
  }
} 