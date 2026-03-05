import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPublicUrl } from '@/lib/r2';
import { createMuxAsset } from '@/lib/mux';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const completeSchema = z.object({
  contentId: z.string().cuid(),
  key: z.string().min(1),
  isVideo: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { contentId, key, isVideo } = parsed.data;

  // Verify ownership
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  if (content.creatorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const publicUrl = getPublicUrl(key);

  if (isVideo) {
    // Submit to Mux for processing
    try {
      const asset = await createMuxAsset(publicUrl);
      const playbackId = asset.playback_ids?.[0]?.id;

      await prisma.content.update({
        where: { id: contentId },
        data: {
          fileUrl: publicUrl,
          muxAssetId: asset.id,
          muxPlaybackId: playbackId ?? null,
          status: 'REVIEW',
        },
      });
    } catch (err) {
      console.error('Mux error:', err);
      // Still save file URL even if Mux fails
      await prisma.content.update({
        where: { id: contentId },
        data: { fileUrl: publicUrl, status: 'REVIEW' },
      });
    }
  } else {
    await prisma.content.update({
      where: { id: contentId },
      data: { fileUrl: publicUrl, status: 'REVIEW' },
    });
  }

  return NextResponse.json({ success: true, fileUrl: publicUrl });
}
