import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createContentSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role } = session.user;
  if (role !== 'CREATOR' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Creator role required' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createContentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Verify topic exists and fetch its university
  const topic = await prisma.topic.findUnique({
    where: { id: parsed.data.topicId },
    include: {
      subject: { include: { degree: { select: { universityId: true } } } },
    },
  });
  if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

  // CREATORs must be verified for the topic's university
  if (role === 'CREATOR') {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verificationStatus: true, universityId: true },
    });

    if (dbUser?.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Your creator application must be verified before uploading' },
        { status: 403 },
      );
    }

    const topicUniversityId = topic.subject.degree.universityId;
    if (dbUser.universityId !== topicUniversityId) {
      return NextResponse.json(
        { error: 'You can only upload content for your verified university' },
        { status: 403 },
      );
    }
  }

  const content = await prisma.content.create({
    data: {
      ...parsed.data,
      creatorId: session.user.id,
      status: 'DRAFT',
    },
  });

  return NextResponse.json(content, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId');

  const session = await getServerSession(authOptions);

  const where: Record<string, unknown> = {};

  if (creatorId) {
    if (session?.user.id === creatorId || session?.user.role === 'ADMIN') {
      where.creatorId = creatorId;
    } else {
      where.creatorId = creatorId;
      where.status = 'PUBLISHED';
    }
  } else {
    where.status = 'PUBLISHED';
  }

  const content = await prisma.content.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, image: true } },
      topic: {
        include: {
          subject: { include: { degree: { include: { university: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(content);
}
