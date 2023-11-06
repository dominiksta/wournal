import { createContext } from "react";
import { CanvasToolName } from "../../document/CanvasTool";
import { Wournal } from "../../document/Wournal";
import { CanvasToolConfig, ConfigDTO, defaultConfig } from "../../persistence/ConfigDTO";
import Store, { Thunk } from "../util/redux/Store";

// ======================================================================
// A `Store` to hold global application configuration.
// ======================================================================

// ----------------------------------------------------------------------
// setup
// ----------------------------------------------------------------------

type configStoreActionTypes =
    "Set" |
    "SetTmp" |
    "SetCanvasToolConfig" |
    "SetTheme" |
    "SetRightClick" |
    "SetColorConfig";

type ConfigStoreState = {
    /** The state as saved in the configured `ConfigRepostory` */
    saved: ConfigDTO,
    /** Temporary state for editing in the `SettingsEditor` */
    tmp: ConfigDTO,
}

export const ConfigStore = new Store<ConfigStoreState, configStoreActionTypes>(
    "Config", {saved: defaultConfig(), tmp: defaultConfig()},
);

export const ConfigStoreCtx = createContext({store: ConfigStore});

// ----------------------------------------------------------------------
// reducer implementation
// ----------------------------------------------------------------------

export const ConfigStore_Set = ConfigStore.addReducer(
    "Set",
    (state, payload: ConfigDTO) => {
        state.tmp = payload; state.saved = payload;
    }
)

export const ConfigStore_SetTmp = ConfigStore.addReducer(
    "SetTmp",
    (state, payload: ConfigDTO) => {
        state.tmp = payload;
    }
)

export const ConfigStore_SetCanvasToolConfig = ConfigStore.addReducer(
    "SetCanvasToolConfig",
    (state, payload: CanvasToolConfig) => {
        state.tmp.tools = payload;
    }
)

export const ConfigStore_SetColorConfig = ConfigStore.addReducer(
    "SetColorConfig",
    (state, payload: {name: string, color: string}[]) => {
        state.tmp.colorPalette = payload;
    }
)

export const ConfigStore_SetTheme = ConfigStore.addReducer(
    "SetTheme",
    (state, payload: {theme: "dark" | "light" | "auto"}) => {
        state.tmp.theme = payload.theme;
    }
)

export const ConfigStore_SetRightClick = ConfigStore.addReducer(
    "SetRightClick",
    (state, payload: {r: CanvasToolName}) => {
        state.tmp.binds.rightClick = payload.r;
    }
)

export const ConfigStore_SaveConfig: Thunk<ConfigStoreState, {wournal: Wournal}> =
    (payload: {wournal: Wournal}) =>
        async (dispatch, getState) => {
            Wournal.CONF = getState().tmp;
            await payload.wournal.saveConfig(Wournal.CONF);
            await payload.wournal.loadConfig();
        };
