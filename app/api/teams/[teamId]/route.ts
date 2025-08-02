import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        projects: {
          include: {
            milestones: true,
            funding: true,
          },
        },
        credibility: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const body = await req.json();
    
    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    // Update team with provided data
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: body,
      include: {
        members: {
          include: {
            user: true,
          },
        },
        projects: {
          include: {
            milestones: true,
            funding: true,
          },
        },
        credibility: true,
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error: any) {
    console.error('Error updating team:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update team.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    
    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        projects: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

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
    
    return NextResponse.json({ message: `Team ${teamId} deleted successfully.` });
  } catch (error: any) {
    console.error('Delete team error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete team.' }, { status: 500 });
  }
} 