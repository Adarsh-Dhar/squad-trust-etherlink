import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, type, data } = await req.json();
  const notification = await prisma.notification.create({
    data: { userId, type, data },
  });
  return NextResponse.json(notification);
} 