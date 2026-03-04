'use client';

import MuxPlayer from '@mux/mux-player-react';

interface VideoPlayerProps {
  playbackId: string;
  title: string;
}

export function VideoPlayer({ playbackId, title }: VideoPlayerProps) {
  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-black">
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title }}
        style={{ width: '100%', height: '100%' }}
        accentColor="#3b82f6"
      />
    </div>
  );
}
