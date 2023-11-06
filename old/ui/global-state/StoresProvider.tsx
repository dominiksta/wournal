import { useState } from "react";
import Store from "../util/redux/Store";
import { ConfigStore, ConfigStoreCtx } from "./ConfigStore";
import { CurrentToolConfigStore, CurrentToolConfigStoreCtx } from "./CurrentToolConfigStore";

/**
 * This compoennt registers the state of every `Store` as a react context, so
 * that the indivdual components update on a state change.
 */
export default function StoresProvider({
    children
}: {
    children: JSX.Element[] | JSX.Element
}) {

    return (
        <StoreProvider context={ConfigStoreCtx} store={ConfigStore}>
            <StoreProvider context={CurrentToolConfigStoreCtx}
                store={CurrentToolConfigStore}>
                {children}
            </StoreProvider>
        </StoreProvider>
    );
}

/** A simple helper for `StoresProvider`. */
function StoreProvider({
    context,
    store,
    children,
}: {
    store: Store<any, any>,
    context: React.Context<{store: Store<any, any>}>,
    children: JSX.Element[] | JSX.Element
}) {
    const [storeState, setStoreState] = useState({store: store});
    store.updateReactState = setStoreState;

    return (
        <context.Provider value={storeState}>
            {children}
        </context.Provider>
    );
}
