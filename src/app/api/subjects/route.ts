import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSubjectSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSubjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, degreeId, description } = parsed.data;
  const slug = slugify(name);

  const existing = await prisma.subject.findUnique({ where: { degreeId_slug: { degreeId, slug } } });
  if (existing) return NextResponse.json({ error: 'Subject already exists in this degree' }, { status: 409 });

  const subject = await prisma.subject.create({
    data: { name, slug, degreeId, description, createdById: session.user.id },
  });

  return NextResponse.json(subject, { status: 201 });
}
