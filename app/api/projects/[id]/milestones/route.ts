// POST, GET /projects/:projectId/milestones
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const data = await req.json();
    // Ensure dueDate is a valid Date or undefined
    let dueDate = data.dueDate;
    if (dueDate) {
      // Accept both date and datetime, always convert to ISO string
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        dueDate = parsed.toISOString();
      } else {
        dueDate = undefined;
      }
    } else {
      dueDate = undefined;
    }
    const milestone = await prisma.milestone.create({
      data: {
        ...data,
        dueDate,
        projectId: id,
      },
    });
    return NextResponse.json(milestone);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create milestone.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const milestones = await prisma.milestone.findMany({
      where: { projectId: id },
    });
    return NextResponse.json(milestones);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch milestones.' }, { status: 500 });
  }
} 