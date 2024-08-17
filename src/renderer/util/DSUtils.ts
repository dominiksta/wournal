export const DSUtils = {
  /** Return a copy of the given array. The elements are not copied. */
  copyArr: function <T>(arr: T[]) {
    let res: T[] = [];
    for (let el of arr) res.push(el);
    return res;
  },

  moveInArr: function <T>(arr: T[], fromIdx: number, toIdx: number): void {
    const element = arr[fromIdx];
    arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, element);
  },

  /** Return a deep copy of the given object. Might break some complex types. */
  copyObj: function <T>(obj: T) {
    // In the future, this could be updated to use the new
    // https://developer.mozilla.org/en-US/docs/Web/API/structuredClone.
    // For now, structuredClone is not available in my(dominiksta) main
    // development Browser Waterfox (Firefox ESR).
    return JSON.parse(JSON.stringify(obj)) as T;
  },

  // `PropertyKey` is short for "string | number | symbol"
  // since an object key can be any of those types, our key can too
  // in TS 3.0+, putting just "string" raises an error
  hasKey: function <O extends object>(obj: O, key: PropertyKey): key is keyof O {
    return key in obj
  },

  objKeys: function <T extends { [key: string]: any }>(obj: T): (keyof T)[] {
    return Object.keys(obj);
  },

  camelToDash: function(camel: string) {
    const camelToDashRegexp = /[A-Z]/g;
    return camel.replace(camelToDashRegexp, m => "-" + m.toLowerCase());
  },

  trySerialize: function (data: any): string | '<Not Serializable>' {
    if (data instanceof Error) {
      return JSON.stringify({
        'message': data.message,
        'cause': data.cause ?? '<none>',
        'error': data.toString(),
        'stack': data.stack ?? '<none>',
      });
    }
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      if (typeof data === 'object' && 'toString' in data) {
        try {
          return data.toString();
        } catch {
          return '<Not Serializable>';
        }
      } else {
        return '<Not Serializable>';
      }
    }
  },

  checkSerialize: function <T>(data: T): T | '<Not Serializable>' {
    try {
      JSON.stringify(data);
      return data;
    } catch {
      return '<Not Serializable>';
    }
  },

  isScalar: (x: any) => typeof x !== 'object' && typeof x !== 'function',

  waitNotEq: async function(
    getter: () => any, eq: any = null, waitMs: number = 200,
    maxAttempt: number = 5, doThrow = false,
  ): Promise<boolean> {
    let attempts = 0;
    while (getter() === eq) {
      attempts++;
      if (attempts >= maxAttempt) {
        if (doThrow) throw new Error(`var is still ${eq}`);
        else return false;
      }
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    return true;
  }
}
