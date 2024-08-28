import { Socket } from 'socket.io-client';

export function emitWithRetry(socket: Socket, event: string, arg: unknown, retries = 5) {
    if (!retries) return;
    socket.timeout(2000).emit(event, arg, (err: unknown) => {
        if (err) {
            // no ack from the server, let's retry
            emitWithRetry(socket, event, arg, retries - 1);
        }
    });
}
