import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Rocket } from 'lucide-react';
import { RecordedEvent } from '~insider/types/recording';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { SimpleTooltip } from './simple/SimpleTooltip';

type PlaybackProps = {
    recording: RecordedEvent[];
    onEmit: (event: RecordedEvent['event'], ...args: RecordedEvent['args']) => void;
    onReset: () => void;
};

const formatTime = (ms: number) => {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    seconds %= 60;
    minutes %= 60;

    let out = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (hours > 0) out = `${hours}:${out}`;

    return out;
};

const SKIP_LONG_PAUSES_THRESHOLD = 5000;

export const Playback = ({ recording, onEmit, onReset }: PlaybackProps) => {
    const [skipLongPauses, setSkipLongPauses] = useState(false);

    const processedRecording = useMemo(() => {
        if (!skipLongPauses) return recording;

        const processed = cloneDeep(recording);
        let cutTime = 0;

        for (let i = 0; i < processed.length - 1; i++) {
            const current = processed[i];
            const next = processed[i + 1];

            const diff = next.timestampMs - cutTime - current.timestampMs;

            if (diff > SKIP_LONG_PAUSES_THRESHOLD) {
                cutTime +=
                    next.timestampMs - cutTime - current.timestampMs - SKIP_LONG_PAUSES_THRESHOLD;
                next.timestampMs = current.timestampMs + SKIP_LONG_PAUSES_THRESHOLD;
            } else {
                next.timestampMs -= cutTime;
            }
        }

        return processed;
    }, [recording, skipLongPauses]);

    const [playing, setPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [timestamp, setTimestamp] = useState(0);

    const lastEventRef = useRef<RecordedEvent | null>(null);
    const deltaTimeRef = useRef(performance.now());

    const maxTimestamp = processedRecording[processedRecording.length - 1]?.timestampMs || 0;

    const handlePlayPause = () => {
        if (playing) {
            setPlaying(false);
            return;
        }
        deltaTimeRef.current = performance.now();
        setPlaying(true);
    };

    const handleChangeSpeed = () => {
        if (playbackSpeed >= 4) {
            setPlaybackSpeed(1);
        } else {
            setPlaybackSpeed(playbackSpeed * 2);
        }
    };

    const processNewTimestamp = useCallback(
        (nextTimestamp: number) => {
            // If we reached the end of the recording, stop playback
            if (nextTimestamp === maxTimestamp) {
                setPlaying(false);
                return;
            }

            // If we moved playback backwards, reset the last event
            if ((lastEventRef.current?.timestampMs || 0) > nextTimestamp) {
                lastEventRef.current = null;
                onReset();
            }

            const eventsToEmit: RecordedEvent[] = [];
            for (const event of processedRecording) {
                if (event.timestampMs > nextTimestamp) break;
                if ((lastEventRef.current?.timestampMs || 0) < event.timestampMs) {
                    eventsToEmit.push(event);
                }
            }

            for (const event of eventsToEmit) {
                onEmit(event.event, ...event.args);
                lastEventRef.current = event;
            }
        },
        [maxTimestamp, onEmit, onReset, processedRecording],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedProcessNewTimestamp = useCallback(debounce(processNewTimestamp, 100), [
        processNewTimestamp,
    ]);

    useEffect(() => {
        const abortController = new AbortController();
        const advance = (now: number) => {
            if (abortController.signal.aborted) return;
            if (!playing) return;

            const deltaTime = now - (deltaTimeRef.current || now);
            deltaTimeRef.current = now;

            let nextTimestamp = 0;
            setTimestamp(timestamp => {
                nextTimestamp = Math.min(maxTimestamp, timestamp + deltaTime * playbackSpeed);
                return nextTimestamp;
            });
            processNewTimestamp(nextTimestamp);

            requestAnimationFrame(advance);
        };

        requestAnimationFrame(advance);

        return () => {
            abortController.abort();
        };
    }, [
        setTimestamp,
        playing,
        maxTimestamp,
        playbackSpeed,
        onReset,
        processedRecording,
        onEmit,
        lastEventRef,
        processNewTimestamp,
    ]);

    const handleScrub = (newTimestamp: number) => {
        setPlaying(false);
        setTimestamp(newTimestamp);
        debouncedProcessNewTimestamp(newTimestamp);
    };

    const handleToggleSkipLongPauses = () => {
        handleScrub(0);
        setSkipLongPauses(!skipLongPauses);
    };

    return (
        <div className="py-2 px-3 flex gap-2 items-center">
            <SimpleTooltip
                tipContent={`Clamps pauses between events to ${SKIP_LONG_PAUSES_THRESHOLD / 1000}s`}
            >
                <Button
                    variant={skipLongPauses ? 'default' : 'secondary'}
                    size="icon-sm"
                    onClick={handleToggleSkipLongPauses}
                    className="text-lg flex-shrink-0"
                >
                    <Rocket size={18} />
                </Button>
            </SimpleTooltip>
            <Button
                variant="secondary"
                size="icon-sm"
                onClick={handleChangeSpeed}
                className="flex-shrink-0"
            >
                x{playbackSpeed}
            </Button>
            <Button
                variant="secondary"
                size="icon-sm"
                onClick={handlePlayPause}
                className="flex-shrink-0"
            >
                {playing ? <Pause size={18} /> : <Play size={18} />}
            </Button>

            <div className="min-w-16 text-center select-none">{formatTime(timestamp)}</div>

            <Slider
                size="sm"
                value={[timestamp]}
                max={maxTimestamp}
                onValueChange={e => {
                    handleScrub(e[0]);
                }}
            />

            <div className="min-w-16 text-center select-none">{formatTime(maxTimestamp)}</div>
        </div>
    );
};
