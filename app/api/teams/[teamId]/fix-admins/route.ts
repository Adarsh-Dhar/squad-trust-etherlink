import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  const { teamId } = params;

  // Get the team and its members
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Find the creator (first admin, fallback to first member)
  let adminMember = team.members.find((m) => m.role === "ADMIN");
  if (!adminMember && team.members.length > 0) {
    adminMember = team.members[0];
  }
  if (!adminMember) return NextResponse.json({ error: "No members found" }, { status: 404 });

  // Set only the creator as ADMIN, all others as MEMBER
  await Promise.all(
    team.members.map((member) =>
      prisma.teamMember.update({
        where: { id: member.id },
        data: { role: member.id === adminMember.id ? "ADMIN" : "MEMBER" },
      })
    )
  );

  return NextResponse.json({ success: true, adminUserId: adminMember.userId });
} 