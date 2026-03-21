import { Head } from '@inertiajs/react';
import {
    VideoPlayer,
    VideoPlayerControlBar,
    VideoPlayerMuteButton,
    VideoPlayerPlayButton,
    VideoPlayerSeekBackwardButton,
    VideoPlayerSeekForwardButton,
    VideoPlayerTimeDisplay,
    VideoPlayerTimeRange,
    VideoPlayerVolumeRange,
    VideoPlayerContent,
} from '@/components/kibo-ui/video-player';

export default function Mvp({ videoUrl }: { videoUrl: string | null }) {
    return (
        <>
            <Head title="MVP Showcase" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <h1 className="mb-8 text-3xl font-bold tracking-tight">MVP Showcase</h1>
                {videoUrl ? (
                    <VideoPlayer className="w-full max-w-4xl overflow-hidden rounded-xl">
                        <VideoPlayerContent src={videoUrl} slot="media" />
                        <VideoPlayerControlBar>
                            <VideoPlayerPlayButton />
                            <VideoPlayerSeekBackwardButton />
                            <VideoPlayerSeekForwardButton />
                            <VideoPlayerTimeRange />
                            <VideoPlayerTimeDisplay />
                            <VideoPlayerMuteButton />
                            <VideoPlayerVolumeRange />
                        </VideoPlayerControlBar>
                    </VideoPlayer>
                ) : (
                    <p className="text-muted-foreground">No video configured.</p>
                )}
            </div>
        </>
    );
}
