import { Upload } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '~/utils/shadcn';

type DropZoneProps = Omit<
    React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    'type'
> & {
    description: React.ReactNode;
};

export const DropZone = ({ description, ...rest }: DropZoneProps) => {
    const [onHoveringFile, setIsHoveringFile] = useState(false);

    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div
            className={cn(
                'relative flex justify-center px-16 py-12 rounded-xl border-2 border-neutral-700 border-dashed bg-neutral-950 overflow-hidden',
                onHoveringFile && 'bg-neutral-800',
            )}
        >
            <div className="flex flex-col gap-6 items-center pointer-events-none">
                <Upload size={32} />
                {description && <div className="font-medium">{description}</div>}
            </div>
            <input
                ref={inputRef}
                {...rest}
                type="file"
                className="absolute size-full opacity-0 top-0 left-0 right-0 bottom-0 cursor-pointer"
                onDragEnter={() => setIsHoveringFile(true)}
                onDragLeave={() => setIsHoveringFile(false)}
            />
        </div>
    );
};
