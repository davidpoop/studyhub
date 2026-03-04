import Mux from '@mux/mux-node';

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function createMuxAsset(fileUrl: string) {
  const asset = await mux.video.assets.create({
    input: [{ url: fileUrl }],
    playback_policy: ['public'],
    mp4_support: 'standard',
  });
  return asset;
}

export async function deleteMuxAsset(assetId: string) {
  await mux.video.assets.delete(assetId);
}
