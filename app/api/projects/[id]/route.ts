// GET, PUT, DELETE /projects/:id
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { milestones: true, roles: true, funding: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const project = await prisma.project.update({
      where: { id },
      data,
    });
    return NextResponse.json(project);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update project.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // First, try to delete the project directly to see what constraints exist
    try {
      await prisma.project.delete({ where: { id } });
      return NextResponse.json({ message: `Project ${id} deleted.` });
    } catch (error: any) {
      // If direct delete fails, we need to handle foreign key constraints
      console.log('Direct delete failed, handling constraints:', error.message);
      
      // Use a transaction to ensure all related records are deleted
      await prisma.$transaction(async (tx) => {
        // Delete funding records first (this model definitely exists)
        await tx.funding.deleteMany({
          where: { projectId: id }
        });
        
        // Delete contributor roles (this model definitely exists)
        await tx.contributorRole.deleteMany({
          where: { projectId: id }
        });
        
        // Delete milestones (this model definitely exists)
        await tx.milestone.deleteMany({
          where: { projectId: id }
        });
        
        // Try to delete project signatures if the model exists
        try {
          await tx.projectSignature.deleteMany({
            where: { projectId: id }
          });
        } catch (e) {
          console.log('ProjectSignature model not available');
        }
        
        // Try to delete investor signatures if the model exists
        try {
          await tx.investorSignature.deleteMany({
            where: { projectId: id }
          });
        } catch (e) {
          console.log('InvestorSignature model not available');
        }
        
        // Try to delete milestone investor signatures if the model exists
        try {
          await tx.milestoneInvestorSignature.deleteMany({
            where: { projectId: id }
          });
        } catch (e) {
          console.log('MilestoneInvestorSignature model not available');
        }
        
        // Finally, delete the project
        await tx.project.delete({
          where: { id }
        });
      });
      
      return NextResponse.json({ message: `Project ${id} deleted.` });
    }
  } catch (error: any) {
    console.error('Delete project error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete project.' }, { status: 500 });
  }
} 