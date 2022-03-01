import { useState } from "react";
import { ObjWithSetter } from "./ObjWithSetter";

/**
 * Like reacts internal `useState`, except the returned setter calls the setter
 * of the passed in `ObjWithSetter` in addition to setting the state. Useful for
 * updating state in a child component and setting a value in the parent
 * component at the same time, *without* causing the parent to re-render.
 */
export function useStateWithSetter<T>(obj: ObjWithSetter<T>): [T, (t: T) => any] {
    const [state, setStateInternal] = useState<T>(obj.value);
    const setState = (newValue: T) => {
        obj.setValue(newValue);
        setStateInternal(newValue);
    }
    return [state, setState];
}
