import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, applicationId } = await params;

    // Get the user (reviewer)
    const reviewer = await prisma.user.findUnique({
      where: { walletAddress: session.user.walletAddress.toLowerCase() },
    });

    if (!reviewer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if project exists and user has permission to review applications
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { team: { include: { members: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is project creator or team admin
    const isProjectCreator = project.creator === session.user.walletAddress.toLowerCase();
    const isTeamAdmin = project.team?.members.some(
      member => member.userId === reviewer.id && member.role === 'ADMIN'
    );

    if (!isProjectCreator && !isTeamAdmin) {
      return NextResponse.json({ error: 'You do not have permission to review applications' }, { status: 403 });
    }

    // Get the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { applicant: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.projectId !== projectId) {
      return NextResponse.json({ error: 'Application does not belong to this project' }, { status: 400 });
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application has already been reviewed' }, { status: 400 });
    }

    // Delete the application
    await prisma.application.delete({
      where: { id: applicationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting application:', error);
    return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
  }
} 