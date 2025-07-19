// PATCH /milestones/:id/complete
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Safely parse request body
    let body = {};
    let achievedValue, verificationData;
    
    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        body = await req.json();
        achievedValue = body.achievedValue;
        verificationData = body.verificationData;
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      // Continue with empty body if parsing fails
    }
    
    // Get the current milestone
    const currentMilestone = await prisma.milestone.findUnique({
      where: { id },
    });
    
    if (!currentMilestone) {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }
    
    // Update milestone data
    const updateData: any = {
      completed: true,
      lastUpdated: new Date(),
    };
    
    // If this is a KPI milestone, update achieved value and status
    if (currentMilestone.kpi && achievedValue !== undefined) {
      updateData.achievedValue = achievedValue;
      
      // Determine status based on achievement
      if (achievedValue >= (currentMilestone.targetValue || 0)) {
        updateData.status = 'ACHIEVED';
      } else {
        updateData.status = 'FAILED';
      }
    } else {
      // For non-KPI milestones, just mark as completed
      updateData.status = 'ACHIEVED';
    }
    
    const milestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
    });
    
    // If verification data is provided, create verification record
    if (verificationData && currentMilestone.kpi) {
      await prisma.milestoneVerification.create({
        data: {
          milestoneId: id,
          verifierId: verificationData.verifierId,
          verificationType: verificationData.type || 'MANUAL_VERIFICATION',
          dataSource: verificationData.dataSource,
          verifiedValue: achievedValue,
          confidence: verificationData.confidence || 1.0,
          comment: verificationData.comment,
        }
      });
    }
    
    return NextResponse.json({ 
      message: `Milestone ${id} marked as completed.`, 
      milestone,
      kpiAchieved: currentMilestone.kpi ? (achievedValue >= (currentMilestone.targetValue || 0)) : null
    });
  } catch (error: any) {
    console.error('Milestone completion error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to mark milestone as completed.' }, { status: 500 });
  }
} 