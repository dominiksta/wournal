export type ConfigDTO = {
    pen: {
        mouseBufferSize: number,
    }
}

export function defaultConfig(): ConfigDTO {
    return {
        pen: {
            mouseBufferSize: 4,
        }
    }
}
