import { useContext } from "react";
import Store from "./Store";

/**
 * Return a part of the state of the `Store` in the given `context`.
 * Example:
 *   const colorPalette = useDispatch(ConfigStoreCtx, s => s.colorPalette);
 */
export default function useSelector<StateT, ActionTypes extends string, ReturnT>(
    context: React.Context<{store: Store<StateT, ActionTypes>}>,
    selector: (state: StateT) => ReturnT
): ReturnT {
    const storeCtx = useContext(context);
    return selector(storeCtx.store.getState());
}
