// GET /api/kpi-templates
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    
    const where: any = {
      isPublic: true,
    };
    
    if (category) {
      where.category = category;
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    const templates = await prisma.kPITemplate.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('KPI templates fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch KPI templates.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, kpis, difficulty, description, createdBy } = body;
    
    // Validate required fields
    if (!name || !category || !kpis || !difficulty) {
      return NextResponse.json({ 
        error: 'Name, category, kpis, and difficulty are required.' 
      }, { status: 400 });
    }
    
    const template = await prisma.kPITemplate.create({
      data: {
        name,
        category,
        kpis,
        difficulty,
        description,
        createdBy,
      }
    });
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('KPI template creation error:', error);
    return NextResponse.json({ error: 'Failed to create KPI template.' }, { status: 500 });
  }
} 