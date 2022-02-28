import { h } from "preact";

export const changeValue = (setFunc: (val: string) => void) => {
    return (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
        setFunc((evt.target as HTMLInputElement).value);
    };
};
