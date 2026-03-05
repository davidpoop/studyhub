import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const degree = await prisma.degree.findUnique({
    where: { id: params.id },
    include: {
      university: true,
      subjects: {
        include: { _count: { select: { topics: true } } },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!degree) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(degree);
}
