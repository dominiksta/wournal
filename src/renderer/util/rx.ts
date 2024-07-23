import { rx } from "@mvuijs/core";

export function pairwise<T>(): rx.OperatorFunction<T, [T | undefined, T]> {
  return orig => new rx.Stream(observer => {
    let previousValue: T | undefined = undefined

    return orig.subscribe({
      ...observer,
      next(v) {
        observer.next([previousValue, v]);
        previousValue = v;
      }
    })
  });
}
