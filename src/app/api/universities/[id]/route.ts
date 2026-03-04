import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const university = await prisma.university.findUnique({
    where: { id: params.id },
    include: {
      degrees: {
        include: { _count: { select: { subjects: true } } },
        orderBy: { name: 'asc' },
      },
      _count: { select: { degrees: true } },
    },
  });

  if (!university) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(university);
}
