import { createContext, ReactNode, useContext, useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '../ui/alert-dialog';

type AlertRequest = {
    title: ReactNode;
    body?: ReactNode;
    okButtonContent?: ReactNode;
    cancelButtonContent?: ReactNode;
    onConfirm: () => void;
};

type AlertDialogContext = {
    confirm: (request: AlertRequest) => void;
};

const alertDialogContext = createContext<AlertDialogContext | undefined>(undefined);

export const AlertDialogProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [request, setRequest] = useState<AlertRequest | null>(null);

    const confirm = (request: AlertRequest) => {
        setIsOpen(true);
        setRequest(request);
    };

    return (
        <>
            <alertDialogContext.Provider value={{ confirm }}>
                {children}
            </alertDialogContext.Provider>
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{request?.title}</AlertDialogTitle>
                        {request?.body && (
                            <AlertDialogDescription>{request?.body}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {request?.cancelButtonContent ?? 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={request?.onConfirm}>
                            {request?.okButtonContent ?? 'Continue'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export const useAlertDialog = () => {
    const context = useContext(alertDialogContext);
    if (!context) {
        throw new Error('useAlertDialog must be used within a AlertDialogProvider');
    }

    return context;
};
