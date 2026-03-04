import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    include: {
      subject: {
        include: {
          degree: { include: { university: true } },
        },
      },
      content: {
        where: { status: 'PUBLISHED' },
        include: {
          creator: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(topic);
}
