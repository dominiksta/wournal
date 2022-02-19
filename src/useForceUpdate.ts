import { useState } from 'react';

/** Manually trigger a re-render of the component */
export function useForceUpdate(){
    const [value, setValue] = useState(0);
    return () => setValue(value => value + 1);
}
