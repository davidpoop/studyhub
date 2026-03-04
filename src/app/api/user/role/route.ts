import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applicationSchema = z.object({
  universityId: z.string().cuid(),
  verificationDegree: z.string().min(2).max(200),
  verificationNote: z.string().min(10).max(1000),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'USER') {
    return NextResponse.json({ error: 'Already a creator or admin' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { universityId, verificationDegree, verificationNote } = parsed.data;

  const university = await prisma.university.findUnique({ where: { id: universityId } });
  if (!university) return NextResponse.json({ error: 'University not found' }, { status: 404 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      universityId,
      verificationDegree,
      verificationNote,
      verificationStatus: 'PENDING',
    },
    select: { verificationStatus: true },
  });

  return NextResponse.json(user);
}
