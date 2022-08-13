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
                if (item.kind === "file" && item.type.startsWith("image")) {
                    evt.preventDefault();
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    callback(item.getAsFile()!);
                }
            }
        }
    };
};

export const onEnterOnTextArea = (callback: () => void | Promise<void>) => {
    return function (this: HTMLTextAreaElement, evt: KeyboardEvent) {
        if (evt.key === "Enter") {
            if (evt.ctrlKey) {
                // insert new line
                const area = evt.target as HTMLTextAreaElement | undefined;
                if (area) {
                    const start = area.selectionStart;
                    const end = area.selectionEnd;
                    const origText = area.value;
                    const newText = `${origText.substring(0, start)}\n${origText.substring(end)}`;
                    area.value = newText;
                    area.selectionStart = start + 1;
                    area.selectionEnd = start + 1;
                }
                return;
            }
            evt.preventDefault();
            callback();
        }
    };
};
