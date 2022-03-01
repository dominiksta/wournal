export interface ObjWithSetter<T> {
    value: T,
    setValue: (t: T) => any,
}
