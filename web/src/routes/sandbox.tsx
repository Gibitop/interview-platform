import { createFileRoute } from '@tanstack/react-router';
import { NotesEditor } from '~/components/NotesEditor';

export const Route = createFileRoute('/sandbox')({
    component: () => {
        return (
            <div className="h-screen">
                <NotesEditor />
            </div>
        );
    },
});
