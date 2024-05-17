import { Link } from '@tanstack/react-router';
import { cn } from '~/utils/shadcn';

type TLogoProps = {
    isSmall?: boolean;
    isLink?: boolean;
    isCentered?: boolean;
    className?: string;
};

const Wrapper = ({ isLink, children }: { isLink?: boolean; children: React.ReactNode }) =>
    isLink ? <Link to="/">{children}</Link> : <>{children}</>;

export const Logo = ({ isSmall, isLink, isCentered, className }: TLogoProps) => {
    return (
        <h1
            className={cn(
                'font-semibold',
                isSmall && 'text-lg leading-6',
                !isSmall && 'text-3xl',
                isCentered && 'w-full text-center',
                className,
            )}
        >
            <Wrapper isLink={isLink}>
                Interview platform
                <sup className="text-xs ml-1">beta</sup>
            </Wrapper>
        </h1>
    );
};
