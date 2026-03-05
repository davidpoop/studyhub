import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUniversitySchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  const universities = await prisma.university.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
    include: { _count: { select: { degrees: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(universities);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createUniversitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, country, city, description } = parsed.data;
  const slug = slugify(name);

  const existing = await prisma.university.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'University already exists' }, { status: 409 });
  }

  const university = await prisma.university.create({
    data: { name, slug, country, city, description, createdById: session.user.id },
  });

  return NextResponse.json(university, { status: 201 });
}
