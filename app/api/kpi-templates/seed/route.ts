// POST /api/kpi-templates/seed
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SAMPLE_KPI_TEMPLATES } from '@/lib/kpi-templates';
import { KPICategory, DifficultyTier } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    // Check if templates already exist
    const existingTemplates = await prisma.kPITemplate.findMany({
      where: { isPublic: true }
    });
    
    if (existingTemplates.length > 0) {
      return NextResponse.json({ 
        message: 'Templates already exist in database.',
        count: existingTemplates.length 
      });
    }
    
    // Create templates
    const createdTemplates = [];
    for (const template of SAMPLE_KPI_TEMPLATES) {
      const created = await prisma.kPITemplate.create({
        data: {
          name: template.name,
          category: template.category as KPICategory,
          difficulty: template.difficulty as DifficultyTier,
          description: template.description,
          kpis: template.kpis,
          isPublic: true,
        }
      });
      createdTemplates.push(created);
    }
    
    return NextResponse.json({
      message: `Successfully seeded ${createdTemplates.length} KPI templates.`,
      templates: createdTemplates
    });
    
  } catch (error) {
    console.error('KPI template seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed KPI templates.' }, { status: 500 });
  }
} 