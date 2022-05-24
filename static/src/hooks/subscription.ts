import { useEffect, useState } from "preact/hooks";
import { getClient } from "../utils/graphql";

export const useSubscription: <T>(gql: string, varbs: Record<string, unknown>) => T | null = <T>(gql: string, varbs = {}) => {
    const [value, setValue] = useState(null as (T | null));

    useEffect(() => {
        const client = getClient();
        const doSubscribe = () => {
            return client.subscribe({ query: gql, variables: varbs }, {
                next: (value) => {
                    if (value.data) {
                        setValue(value.data as (T | null));
                    } else {
                        setValue(null as (T | null));
                    }
                },
                error: (error) => {
                    console.debug(error);
                    setValue(null as (T | null));
                },
                complete: () => {
                    // setValue(null as (T | null));
                },
            });
        };
        const cancelHandler = doSubscribe();
        return cancelHandler;
    }, [gql, varbs]);
    return value;
};
