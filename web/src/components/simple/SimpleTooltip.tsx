import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export type TSimpleTooltipProps = {
    tipContent: React.ReactNode;
    children: React.ReactNode;
    delayDuration?: number;
};

export const SimpleTooltip: React.FC<TSimpleTooltipProps> = ({
    tipContent,
    delayDuration = 500,
    children,
}) => {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={delayDuration}>
                <TooltipTrigger>{children}</TooltipTrigger>
                <TooltipContent>{tipContent}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
