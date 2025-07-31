import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get the current session to get the wallet address
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const walletAddress = session.user.walletAddress.toLowerCase();

    // Find teams where the user is an admin
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            user: {
              walletAddress: walletAddress
            },
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        projects: {
          include: {
            funding: true,
            milestones: true,
          },
        },
        credibility: true,
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams.' }, { status: 500 });
  }
} 