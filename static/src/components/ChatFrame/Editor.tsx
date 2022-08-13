import { h } from "preact";
import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import { onEnterOnTextArea, onPasteImage } from "../../utils/htmlevent";
import { sendTextMessage } from "../../stores";

const readAsBase64String = (file: Blob) => {
    return new Promise((r) => {
        const reader = new FileReader();
        reader.addEventListener("load", (evt) => {
            if (evt.target) {
                const url = evt.target.result as string;
                const start = url.indexOf(",");
                r(url.substring(start + 1));
            } else {
                r("");
            }
        });
        reader.readAsDataURL(file);
    }) as Promise<string>;
};

const Editor: () => h.JSX.Element = () => {
    const [expand, setExpand] = useState(false);
    const [sending, setSending] = useState(false);
    const textareaElement = useRef<HTMLTextAreaElement>(null);
    const textareaStyle = expand ? "w-full h-72 input resize-none" : "w-full h-16 input resize-none";

    const toggleExpand = () => {
        setExpand(!expand);
    };

    const onSelectImage = useCallback(async (file: File) => {
        if (sending) {
            return;
        }
        setSending(true);
        try {
            const imageContent = await readAsBase64String(file);
            const content = [{ type: "image", file: `base64://${imageContent}` }];
            await sendTextMessage(content);
        } finally {
            setSending(false);
        }
    }, [sending]);

    const sendMessage = useCallback(async () => {
        if (sending) {
            return;
        }
        if (textareaElement.current) {
            setSending(true);
            try {
                const value = textareaElement.current.value;
                if (value.trim().length <= 0) return;
                const content = [{ type: "text", text: value }];
                textareaElement.current.value = "";
                await sendTextMessage(content);
            } finally {
                setSending(false);
            }
        }
    }, [sending]);

    const selectImage = useCallback(() => {
        if (sending) {
            return;
        }
        const ip = document.createElement("input") as HTMLInputElement;
        ip.type = "file";
        ip.accept = "image/*";
        ip.addEventListener("change", () => {
            if (ip.files && ip.files.length > 0) {
                onSelectImage(ip.files[0]);
            }
        });
        ip.click();
    }, [onSelectImage, sending]);

    useEffect(() => {
        if (textareaElement.current) {
            const callbackSelectImage = onPasteImage(onSelectImage);
            const callbackEnter = onEnterOnTextArea(sendMessage);
            const currentTextareaElement = textareaElement.current;
            currentTextareaElement.addEventListener("paste", callbackSelectImage);
            currentTextareaElement.addEventListener("keydown", callbackEnter);
            return () => {
                currentTextareaElement.removeEventListener("paste", callbackSelectImage);
                currentTextareaElement.removeEventListener("keydown", callbackEnter);
            };
        }
    });

    return <div class="w-full flex items-center">
        <div class="flex-auto pl-4 pb-4">
            <div class="w-full h-4 cursor-pointer flex justify-center items-center" onClick={toggleExpand}>{expand ? "🞃" : "🞁"}</div>
            <textarea class={textareaStyle} ref={textareaElement} autoComplete="off" autoCorrect="off" disabled={sending} />
        </div>
        <div class="flex-shrink-0 p-4">
            <button class="flex-shrink-0 btn btn-primary" onClick={sendMessage} disabled={sending}>{sending ? "发送中..." : "发送"}</button>
            <button class="flex-shrink-0 btn btn-primary ml-4" onClick={selectImage} disabled={sending}>图片</button>
        </div>
    </div>;
};

export default Editor;
