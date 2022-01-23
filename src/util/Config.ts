export class Config {
    public static config = {
        pen: {
            mouseBufferSize: 4
        }
    };

    public static save() {
        localStorage.setItem("config", JSON.stringify(Config.config));
    }

    // NOTE(dominiksta): In the future, this should be verified using something
    // like json or xml schema
    public static load() {
        Config.config = JSON.parse(localStorage.getItem("config"));
    }
}

export const CONF = Config.config;
