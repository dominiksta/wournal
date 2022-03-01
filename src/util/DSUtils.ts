export const DSUtils = {
    /** Wether two `Map` objects are equal */
    compareMaps: function(map1: Map<any, any>, map2: Map<any, any>): boolean {
        // https://stackoverflow.com/a/35951373
        let testVal;
        if (map1.size !== map2.size) return false;
        for (let [key, val] of map1) {
            testVal = map2.get(key);
            // in cases of an undefined value, make sure the key
            // actually exists on the object so there are no false positives
            if (testVal !== val || (testVal === undefined && !map2.has(key))) {
                return false;
            }
        }
        return true;
    },

    /** Return a copy of the given array. The elements are not copied. */
    copyArr: function<T>(arr: T[]) {
        let res: T[] = [];
        for (let el of arr) res.push(el);
        return res;
    },

    /** Return a deep copy of the given object. Might break some complex types. */
    copyObj: function<T>(obj: T) {
        // In the future, this could be updated to use the new
        // https://developer.mozilla.org/en-US/docs/Web/API/structuredClone.
        // For now, structuredClone is not available in my(dominiksta) main
        // development Browser Waterfox (Firefox ESR).
        return JSON.parse(JSON.stringify(obj)) as T;
    },

    // `PropertyKey` is short for "string | number | symbol"
    // since an object key can be any of those types, our key can too
    // in TS 3.0+, putting just "string" raises an error
    hasKey: function<O>(obj: O, key: PropertyKey): key is keyof O {
        return key in obj
    },
}
