import { Patch, type ITimestampStruct } from 'json-joy/lib/json-crdt';

function binarySearch<T>(arr: T[], compare: (a: T) => number) {
    let start = 0;
    let end = arr.length - 1;

    while (start <= end) {
        let mid = Math.floor((start + end) / 2);
        const compareResult = compare(arr[mid]!);

        if (compareResult === 0) {
            return mid;
        }

        if (compareResult > 0) {
            end = mid - 1;
        } else {
            start = mid + 1;
        }
    }
    return -1;
}

const activeFileContentPatches: Patch[] = [];
const activeFileContentTimedPatches: { patch: Patch; time: ITimestampStruct['time'] }[] = [];
const activeFileContentUnTimedPatches: Patch[] = [];

export const pushPatch = (patch: Patch) => {
    const time = patch.getId()?.time;
    activeFileContentPatches.push(patch);
    if (time) {
        activeFileContentTimedPatches.push({ patch, time });
    } else {
        activeFileContentUnTimedPatches.push(patch);
    }
};

export const getMissedPatches = (lastPatchTime: ITimestampStruct['time']) => {
    const index = binarySearch(activeFileContentTimedPatches, (a) => a.time - lastPatchTime);
    return [...activeFileContentTimedPatches.slice(index + 1), ...activeFileContentUnTimedPatches];
};
