import { useContext } from "react";
import Store, { Action } from "./Store";

/**
 * Return the `dispatch` method of the `Store` in the given `context`.
 * Example:
 *   const dispatch = useDispatch(ConfigStoreCtx);
 */
export default function useDispatch<StateT, ActionTypes extends string>(
    context: React.Context<{ store: Store<StateT, ActionTypes> }>
) {
    const storeCtx = useContext(context);

    return (action: Action<ActionTypes, object> | (
        (dispatch: (...args: any[]) => any, getState: () => StateT) => Promise<void>)) =>
        storeCtx.store.dispatch(action);
}
