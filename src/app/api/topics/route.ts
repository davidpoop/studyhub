import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTopicSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createTopicSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, subjectId, order, description } = parsed.data;
  const slug = slugify(name);

  const existing = await prisma.topic.findUnique({ where: { subjectId_slug: { subjectId, slug } } });
  if (existing) return NextResponse.json({ error: 'Topic already exists in this subject' }, { status: 409 });

  const topic = await prisma.topic.create({
    data: { name, slug, subjectId, order: order ?? 0, description, createdById: session.user.id },
  });

  return NextResponse.json(topic, { status: 201 });
}
