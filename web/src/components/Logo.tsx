import { Link } from '@tanstack/react-router';
import { cn } from '~/utils/shadcn';

type TLogoProps = {
    isSmall?: boolean;
    isLink?: boolean;
    to?: string;
    isCentered?: boolean;
    className?: string;
};

const Wrapper = ({
    isLink,
    children,
    to = '/',
}: {
    isLink?: boolean;
    children: React.ReactNode;
    to?: string;
}) => (isLink ? <Link to={to}>{children}</Link> : <>{children}</>);

export const Logo = ({ isSmall, isLink, isCentered, className, to }: TLogoProps) => {
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
            <Wrapper isLink={isLink} to={to}>
                Interview platform
                <sup
                    className={cn(
                        'text-xs',
                        isSmall && 'ml-0.5 -top-1.5',
                        !isSmall && 'ml-1 -top-3',
                    )}
                >
                    beta
                </sup>
            </Wrapper>
        </h1>
    );
};
