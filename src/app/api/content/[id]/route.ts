import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const content = await prisma.content.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, name: true, image: true, bio: true } },
      topic: {
        include: {
          subject: { include: { degree: { include: { university: true } } } },
        },
      },
    },
  });

  if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Increment view count
  await prisma.content.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json(content);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const content = await prisma.content.findUnique({ where: { id: params.id } });
  if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only creator or admin can update
  if (content.creatorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  // Admins can change status; creators can update title/description
  const allowedFields: Record<string, unknown> = {};
  if (body.title) allowedFields.title = body.title;
  if (body.description !== undefined) allowedFields.description = body.description;
  if (body.muxAssetId) allowedFields.muxAssetId = body.muxAssetId;
  if (body.muxPlaybackId) allowedFields.muxPlaybackId = body.muxPlaybackId;
  if (body.fileUrl) allowedFields.fileUrl = body.fileUrl;

  if (session.user.role === 'ADMIN' && body.status) {
    allowedFields.status = body.status;
  }

  const updated = await prisma.content.update({
    where: { id: params.id },
    data: allowedFields,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const content = await prisma.content.findUnique({ where: { id: params.id } });
  if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (content.creatorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.content.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
