import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDegreeSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createDegreeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, universityId, description } = parsed.data;
  const slug = slugify(name);

  const existing = await prisma.degree.findUnique({ where: { universityId_slug: { universityId, slug } } });
  if (existing) return NextResponse.json({ error: 'Degree already exists in this university' }, { status: 409 });

  const degree = await prisma.degree.create({
    data: { name, slug, universityId, description, createdById: session.user.id },
  });

  return NextResponse.json(degree, { status: 201 });
}
