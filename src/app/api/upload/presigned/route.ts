import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/r2';
import { presignedUrlSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Creator role required' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = presignedUrlSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { filename, contentType, contentId } = parsed.data;

  // Verify the content belongs to this creator
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  if (content.creatorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
  const isDoc = ALLOWED_DOC_TYPES.includes(contentType);

  if (!isVideo && !isDoc) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  const ext = filename.split('.').pop() || 'bin';
  const key = `uploads/${session.user.id}/${contentId}/${Date.now()}.${ext}`;

  const presignedUrl = await generatePresignedUploadUrl(key, contentType);

  return NextResponse.json({ presignedUrl, key, isVideo });
}
