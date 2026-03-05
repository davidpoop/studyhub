import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mux } from '@/lib/mux';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('mux-signature') ?? '';

  // Verify Mux webhook signature
  try {
    mux.webhooks.verifySignature(body, req.headers as unknown as Headers, process.env.MUX_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  const { type, data } = event;

  if (type === 'video.asset.ready') {
    const assetId = data.id as string;
    const playbackId = data.playback_ids?.[0]?.id as string | undefined;
    const duration = Math.round(data.duration ?? 0);

    await prisma.content.updateMany({
      where: { muxAssetId: assetId },
      data: {
        muxPlaybackId: playbackId ?? undefined,
        duration,
        status: 'REVIEW',
      },
    });
  }

  if (type === 'video.asset.errored') {
    const assetId = data.id as string;
    await prisma.content.updateMany({
      where: { muxAssetId: assetId },
      data: { status: 'REJECTED' },
    });
  }

  return NextResponse.json({ received: true });
}
