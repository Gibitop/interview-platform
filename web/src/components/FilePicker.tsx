import { useRoomStore } from '~/stores/room';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { useEffect, useState } from 'react';
import { useWebContainer } from '~/hooks/useWebContainer';

export const FilePicker = () => {
    const { isHost, activeFile } = useRoomStore(s => ({
        isHost: s.isHost,
        activeFile: s.activeFile,
    }));

    const [options, setOptions] = useState<string[]>([activeFile]);
    const [isLoading, setIsLoading] = useState(true);

    const wc = useWebContainer(!isHost);

    useEffect(() => {
        if (!wc || !isHost) return;
        const updateOptions = async () => {
            const entries = await wc.fs.readdir('', { withFileTypes: true });
            const files = entries.filter(entry => entry.isFile()).map(entry => entry.name);

            setOptions(files);
            setIsLoading(false);
        };

        wc.fs.watch('', updateOptions);

        updateOptions();
    }, [isHost, wc]);

    return (
        <Select
            disabled={isLoading}
            defaultValue={activeFile}
            value={activeFile}
            onValueChange={value => useRoomStore.setState({ activeFile: value })}
        >
            <SelectTrigger className="w-[180px] h-7">
                <SelectValue placeholder="Pick a file" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {isLoading && <SelectLabel>Loading...</SelectLabel>}
                    {!isLoading &&
                        options.map(file => (
                            <SelectItem key={file} value={file}>
                                {file}
                            </SelectItem>
                        ))}
                    {!isLoading && options.length === 0 && (
                        <SelectItem value={activeFile}>{activeFile}</SelectItem>
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};
