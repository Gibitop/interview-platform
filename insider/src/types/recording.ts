import type { S2CEvent } from "../eventNames";

export type RecordedEvent = {
    timestampMs: number;
    event: S2CEvent;
    args: unknown[];
};

export type Recording = {
    recordingVersion: 1;
    platformVersion: string;
    roomInfo: {
        id: string;
        name: string;
        type: string;
        createdAt: Date;
    };
    recording: RecordedEvent[];
}
