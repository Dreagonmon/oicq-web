import { ExecutionResult } from "graphql-ws";
import { useEffect, useState } from "preact/hooks";
import { getClient } from "../utils/graphql";
import { useStore } from "@nanostores/preact";
import { client as clientStore } from "../utils/store";

export const useSubscription: <T>(gql: string, varbs: Record<string, unknown>) => T | null = <T>(gql: string, varbs = {}) => {
    const clientInStore = useStore(clientStore, { keys: ["qid"]});
    const [ value, setValue ] = useState(null as T | null);
    
    useEffect(()=>{
        const qid = clientInStore.qid;
        const client = getClient();
        //
    }, [clientInStore.qid, gql, varbs]);
    return value;
};