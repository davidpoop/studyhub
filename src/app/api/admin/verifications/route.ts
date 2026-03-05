import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pending = await prisma.user.findMany({
    where: { verificationStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      email: true,
      verificationDegree: true,
      verificationNote: true,
      createdAt: true,
      memberUniversity: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(pending);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, action } = await req.json();
  if (!userId || !['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  if (action === 'APPROVE') {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'CREATOR', verificationStatus: 'VERIFIED' },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: 'REJECTED' },
    });
  }

  return NextResponse.json({ success: true });
}
