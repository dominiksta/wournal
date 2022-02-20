export type ConfigDTO = {
    version: 0.01,
    pen: {
        mouseBufferSize: number,
    },
    eraser: {
        eraseStrokes: boolean,
    },
}

export function defaultConfig(): ConfigDTO {
    return {
        version: 0.01,
        pen: {
            mouseBufferSize: 4,
        },
        eraser: {
            eraseStrokes: false,
        },
    }
}
