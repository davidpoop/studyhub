import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'REVIEW';

  const content = await prisma.content.findMany({
    where: { status: status as 'REVIEW' | 'PUBLISHED' | 'REJECTED' | 'DRAFT' },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      topic: {
        include: {
          subject: { include: { degree: { include: { university: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(content);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { contentId, status } = body;

  if (!contentId || !['PUBLISHED', 'REJECTED', 'REVIEW', 'DRAFT'].includes(status)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const content = await prisma.content.update({
    where: { id: contentId },
    data: { status },
  });

  return NextResponse.json(content);
}
