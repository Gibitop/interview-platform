import { useRoomStore } from '~/stores/room';
import { useRoomContext } from './contexts/useRoomContext';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

export const FilePicker = () => {
    const roomContext = useRoomContext();
    const role = useRoomStore(data => data?.role);

    if (!roomContext) return;

    if (role !== 'host') {
        return <div>{roomContext.activeFilePath}</div>;
    }

    return (
        <Select
            defaultValue={roomContext.activeFilePath}
            value={roomContext.activeFilePath}
            onValueChange={roomContext.changeActiveFilePath}
        >
            <SelectTrigger className="w-[180px] h-7">
                <SelectValue placeholder="Pick a file" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {roomContext.availableFiles.map(
                        file =>
                            file && (
                                <SelectItem key={file} value={file}>
                                    {file}
                                </SelectItem>
                            ),
                    )}
                    {roomContext.availableFiles.length === 0 && (
                        <SelectItem disabled value={'No files available'}>
                            No files available
                        </SelectItem>
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};
