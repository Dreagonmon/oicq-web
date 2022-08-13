import { MapStore } from "nanostores";
import { useEffect, useRef, useState } from "preact/hooks";

export const usePartStore = <T>(store: MapStore, keys: Array<keyof T>) => {
    const [value, setValue] = useState(store.get() as T);
    const lastValueRef = useRef(value);
    useEffect(() => {
        return store.listen((newValue) => {
            const lastValue = lastValueRef.current;
            for (const k of keys) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((newValue as any)[k] !== (lastValue as any)[k]) {
                    setValue(newValue as T);
                    lastValueRef.current = newValue;
                    return;
                }
            }
        });
    }, [store, keys]);
    return value;
};

export const useKeyStore = <T>(store: MapStore, key: keyof T) => {
    const [value, setValue] = useState<T>(store.get() as T);
    const lastValueRef = useRef<T>(value);
    useEffect(() => {
        return store.listen((newValue: T) => {
            const lastValue = lastValueRef.current;
            if ((newValue as T)[key] !== (lastValue as T)[key]) {
                setValue(newValue as T);
                lastValueRef.current = newValue;
                return;
            }
        });
    }, [store, key]);
    return value;
};
