import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const subject = await prisma.subject.findUnique({
    where: { id: params.id },
    include: {
      degree: { include: { university: true } },
      topics: {
        include: { _count: { select: { content: true } } },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!subject) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(subject);
}
