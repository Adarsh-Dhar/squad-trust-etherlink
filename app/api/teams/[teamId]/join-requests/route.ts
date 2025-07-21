import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// GET: List all pending join requests for a team (for admins)
export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  // Check if user is admin
  const admin = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "ADMIN" },
  });
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await prisma.joinRequest.findMany({
    where: { teamId, status: "pending" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(requests);
}

// POST: Create join request (already implemented)
export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const { userId } = await req.json();

  // Check if already requested (only block if there is a pending request)
  const existing = await prisma.joinRequest.findFirst({
    where: { teamId, userId, status: "pending" },
  });
  if (existing) {
    return NextResponse.json({ error: "Already requested" }, { status: 409 });
  }

  // Create join request
  const joinRequest = await prisma.joinRequest.create({
    data: { teamId, userId, status: "pending" },
  });

  // Find all admins (extra safeguard: only unique userIds, and double-check role)
  const admins = await prisma.teamMember.findMany({
    where: { teamId, role: "ADMIN" },
    select: { userId: true },
  });
  const uniqueAdminUserIds = Array.from(new Set(admins.map(a => a.userId)));
  // Send notification to each admin
  await Promise.all(
    uniqueAdminUserIds.map((adminUserId) =>
      prisma.notification.create({
        data: {
          userId: adminUserId,
          type: "join_request",
          data: { teamId, joinRequestId: joinRequest.id, requesterId: userId },
        },
      })
    )
  );

  return NextResponse.json({ success: true });
} 