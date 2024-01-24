import { rx } from "@mvui/core";
import { OperatorFunction } from "@mvui/core/dist/types/rx/stream";

export function pairwise<T>(): OperatorFunction<T, [T | undefined, T]> {
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
