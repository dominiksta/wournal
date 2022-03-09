import { DSUtils } from "../../../util/DSUtils";
import { LOG } from "../../../util/Logging";

/**
 * An action that can be dispatched through the `dispatch` function of a
 * `Store`, which can be accesed through the `useDispatch` hook.
 */
export interface Action<ActionIdent extends string, PayloadT> {
    type: ActionIdent;
    payload: PayloadT;
}

/**
 * A function that returns an `Action`. This makes some code easier to read and
 * write. For example, instead of writing
 *   `dispatch({type: "login", payload: {user: "user", password: "pw"})`
 * one could instead use an `ActionFunc` like this:
 *   `dispatch(userLogin({user: "user", password: "pw"})`
 *
 * Use the `addReducer` method of a `Store` to create these helper functions.
 */
type ActionFunc<ActionIdent extends string, PayloadT> =
    (payload: PayloadT) => Action<ActionIdent, PayloadT>;

/**
 * A function that can asynchronously dispatch actions after performing
 * non-functional operations such as interacting with a db/api/filesystem.
 *
 * It can be passed to the `dispatch` function as if it was an `Action`.
 */
export type Thunk<StateT, PayloadT> = (payload: PayloadT) =>
    (dispatch: (action: Action<string, object>) => StateT, getState: () => StateT) =>
        Promise<void>

/**
 * Implements a redux 'store'. Each Store holds the state of the provided type
 * `StateT` and must implement reducer actions given by the `ActionIdent` string
 * union type.
 *
 * There are four steps to properly initialize a `Store`:
 * 1. Initialize a new `Store` object with the desired state type and action
 *    names.
 * 2. Create and export a react context of type {store: Store}
 * 2. Add reducer implementations for the specified action names.
 * 3. Register the store's react context in `StoresProvider`
 *
 * See the `src/ui/global-state` directory for details and examples.
 */
export default class Store<StateT, ActionIdent extends string> {
    /** The actual current state. */
    private state: StateT;
    /**  */
    private reducers: {
        name: ActionIdent, impl: (state: StateT, payload: any) => void | StateT
    }[] = [];
    /** Return a copy of the current state. */
    public getState = () => DSUtils.copyObj(this.state);

    constructor(
        public name: string,
        initialState: StateT,
    ) {
        this.state = initialState;
    }

    /**
     * Has to be set after initialization. Should trigger a re-render for all
     * components affected by `this.state` - aka all components calling
     * `useSelector` for this store.
     */
    public updateReactState: (s: {store: Store<StateT, ActionIdent>}) => void;

    /**
     * Execute the relevant reducer implementation for the given `action`. The
     * current state is copied before executing the implementation.
     */
    private reducer(
        state: StateT, action: { type: ActionIdent, payload: object }
    ): StateT {
        let newState = DSUtils.copyObj(state);
        for (let reducer of this.reducers) {
            if (action.type === reducer.name) {
                const ret = reducer.impl(newState, action.payload);
                if (ret) newState = ret;
            }
        }
        this.updateReactState({store: this});
        return newState;
    }

    /**
     * "Dispatch"/run the provided action or thunk. An action will be matched to
     * a reducer function previously added via `addReducer`.
     *
     * Should not be called directly from a component. Instead, use
     * `useDispatch` to get access to this function.
     */
    public dispatch(
        action: Action<ActionIdent, object> | (
            (dispatch: (...args: any[]) => any, getState: () => StateT) => Promise<void>)
    ) {
        if (action instanceof Function) { // Thunk
            return action(this.dispatch, this.getState);
        }

        try {
            const newState = this.reducer(this.state, action);
            LOG.debug(
                `Executing action ${action.type} in store ${this.name} `,
                {
                    stateBefore: this.state,
                    stateAfter: newState,
                },
            );
            this.state = newState;
            return newState;
        } catch(e) {
            LOG.error(
                `Error executing action ${action.type} in store ${this.name}`,
                {
                    stateBefore: this.state,
                    error: e
                }
            );
            throw e;
        }
    }

    /**
     * Register a reducer implementation for the given `name`. Example: if
     * `name` is "login", then `impl` will be called when calling
     * `dispatch({type: "login", {<PAYLOAD>})`.
     *
     * Returns an `ActionFunc` that can be exported to other modules to simplify
     * dispatching
     */
    public addReducer<T>(
        name: ActionIdent, impl: (state: StateT, payload: T) => void | StateT
    ): ActionFunc<ActionIdent, T> {
        this.reducers.push({name: name, impl: impl});
        return (payload: T) => ({type: name, payload: payload});
    }

    /** Get an `ActionFunc` for the given `name` aka action type */
    public getActionForReducerName<T>(name: ActionIdent): ActionFunc<ActionIdent, T> {
        return (payload: T) => ({type: name, payload: payload});
    }
}
