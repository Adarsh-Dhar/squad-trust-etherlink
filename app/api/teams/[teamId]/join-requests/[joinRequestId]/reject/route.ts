import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string, joinRequestId: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId, joinRequestId } = await params;

  // Check if user is admin
  const admin = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "ADMIN" },
  });
  if (!admin) return NextResponse.json({ error: "You are not an admin of this team." }, { status: 403 });

  // Get join request
  const joinRequest = await prisma.joinRequest.findUnique({ where: { id: joinRequestId } });
  if (!joinRequest || joinRequest.status !== "pending") {
    return NextResponse.json({ error: "Invalid join request" }, { status: 400 });
  }

  // Update join request
  await prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: { status: "rejected" },
  });

  // Delete notifications for this join request
  await prisma.notification.deleteMany({
    where: {
      type: "join_request",
      data: { path: ["joinRequestId"], equals: joinRequestId },
    },
  });

  return NextResponse.json({ success: true });
} 