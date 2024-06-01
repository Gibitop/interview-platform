import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { JoinRoomScreen } from '~/components/JoinRoomScreen';

const Component = () => {
    const navigate = useNavigate();
    return (
        <JoinRoomScreen
            withSignInButton
            onReady={roomId => {
                navigate({
                    to: '/rooms/$roomId',
                    params: { roomId },
                });
            }}
        />
    );
};

export const Route: unknown = createFileRoute('/')({
    component: Component,
});
