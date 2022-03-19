import { createContext } from "react";
import { Wournal } from "../../document/Wournal";
import { CanvasToolConfig, CanvasToolTextConfig, defaultConfig } from "../../persistence/ConfigDTO";
import Store, { Thunk } from "../util/redux/Store";

// ======================================================================
// A `Store` TODO
// ======================================================================

// ----------------------------------------------------------------------
// setup
// ----------------------------------------------------------------------

type storeActionTypes =
    "Set" |
    "SetCanvasToolTextConfig";

export const CurrentToolConfigStore = new Store<CanvasToolConfig, storeActionTypes>(
    "Config", defaultConfig().tools,
);

export const CurrentToolConfigStoreCtx = createContext({store: CurrentToolConfigStore});

// ----------------------------------------------------------------------
// reducer implementation
// ----------------------------------------------------------------------

export const CurrentToolConfigStore_Set = CurrentToolConfigStore.addReducer(
    "Set",
    (state, payload: CanvasToolConfig) => { state = payload; }
)

export const CurrentToolConfigStore_SetCanvasToolTextConfig =
    CurrentToolConfigStore.addReducer(
        "SetCanvasToolTextConfig",
        (state, payload: CanvasToolTextConfig) => { state.CanvasToolText = payload; }
    )

export const CurrentToolConfigStore_Apply: Thunk<CanvasToolConfig, void> = () =>
    async (dispatch, getState) => {
        Wournal.currToolConf = getState();
    };
