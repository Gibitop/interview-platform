import { io } from 'socket.io-client';

const tokenInput = document.getElementById('token') as HTMLInputElement;
const spectatorModeInput = document.getElementById('spectatorMode') as HTMLInputElement;
const connectButton = document.getElementById('connect') as HTMLButtonElement;
const disconnectButton = document.getElementById('disconnect') as HTMLButtonElement;

const socket = io('ws://127.0.0.1:5001', { transports: ['websocket'], autoConnect: false });

socket.on('connect', () => {
    console.log('Connected to the server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from the server');
});


connectButton.addEventListener('click', () => {
    socket.auth = {
        token: tokenInput.value || undefined,
        spectatorMode: spectatorModeInput.checked,
    };
    socket.connect();
    socket.on('test', (data) => {
        console.log(data);
    });
});

disconnectButton.addEventListener('click', () => {
    socket.off('test');
    socket.disconnect();
});

