import { h } from "preact";

export const changeValue = (setFunc: (val: string) => void) => {
    return (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
        setFunc((evt.target as HTMLInputElement).value);
    };
};

export const onPasteImage = (callback: (file: File) => void | Promise<void>) => {
    return function (this: HTMLElement, evt: ClipboardEvent) {
        if (evt.clipboardData) {
            for (const item of evt.clipboardData.items) {
                console.log(item);
                if (item.kind === "file" && item.type.startsWith("image")) {
                    evt.preventDefault();
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    callback(item.getAsFile()!);
                }
            }
        }
    };
};
