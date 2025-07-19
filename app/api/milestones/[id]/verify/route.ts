// POST /milestones/:id/verify
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      verifierId, 
      verificationType, 
      dataSource, 
      verifiedValue, 
      confidence, 
      comment,
      oracleData 
    } = body;
    
    // Get the milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id },
    });
    
    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }
    
    if (!milestone.kpi) {
      return NextResponse.json({ error: 'This milestone does not have KPI verification.' }, { status: 400 });
    }
    
    // Update milestone with verified value
    const updateData: any = {
      achievedValue: verifiedValue,
      lastUpdated: new Date(),
    };
    
    // Determine status based on achievement
    if (verifiedValue >= (milestone.targetValue || 0)) {
      updateData.status = 'ACHIEVED';
      updateData.completed = true;
    } else {
      // Check if due date has passed
      if (milestone.dueDate && new Date() > new Date(milestone.dueDate)) {
        updateData.status = 'FAILED';
      } else {
        updateData.status = 'AT_RISK';
      }
    }
    
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
    });
    
    // Create verification record
    const verification = await prisma.milestoneVerification.create({
      data: {
        milestoneId: id,
        verifierId,
        verificationType: verificationType || 'MANUAL_VERIFICATION',
        dataSource,
        verifiedValue,
        confidence: confidence || 1.0,
        comment,
      }
    });
    
    return NextResponse.json({
      message: 'Milestone verification recorded successfully.',
      milestone: updatedMilestone,
      verification
    });
    
  } catch (error: any) {
    console.error('Milestone verification error:', error);
    return NextResponse.json({ error: 'Failed to verify milestone.' }, { status: 500 });
  }
} 