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
}
