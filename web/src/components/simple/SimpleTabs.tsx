import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

export type TOption<TValue extends string> = {
    label: string;
    value: TValue;
};

export type TSimpleTabsProps<TValue extends string> = {
    options: TOption<TValue>[] | readonly TOption<TValue>[];
    value: NoInfer<TValue>;
    onChange: (value: TValue) => void;
    className?: string;
};

export const SimpleTabs = <TValue extends string>({
    options,
    value,
    className,
    onChange,
}: TSimpleTabsProps<TValue>) => {
    return (
        <Tabs value={value} onValueChange={val => onChange(val as TValue)} className={className}>
            <TabsList className="w-full flex">
                {options.map(option => (
                    <TabsTrigger key={option.value} value={option.value} className="flex-1">
                        {option.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
};
