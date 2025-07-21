import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const teams = await prisma.team.findMany();
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, bio, website, createdBy, tags } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });
    }
    
    if (!createdBy || typeof createdBy !== 'string') {
      return NextResponse.json({ error: 'Team creator wallet address is required.' }, { status: 400 });
    }

    // Find or create the user based on wallet address
    let user = await prisma.user.findUnique({
      where: { walletAddress: createdBy.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: createdBy.toLowerCase(),
          name: `User ${createdBy.slice(0, 6)}...${createdBy.slice(-4)}`,
        },
      });
    }

    // Create team and automatically add creator as admin member
    const team = await prisma.team.create({
      data: {
        name,
        bio: bio || null,
        website: website || null,
        tags: tags && Array.isArray(tags) ? tags : [],
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN', // Ensure this is the correct enum value
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 });
  }
} 