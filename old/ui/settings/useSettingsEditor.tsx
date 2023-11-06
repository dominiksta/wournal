import { useContext } from "react";
import { Wournal } from "../../document/Wournal";
import { ThemeContext } from "../App";
import { ConfigStoreCtx, ConfigStore_SaveConfig, ConfigStore_SetTmp } from "../global-state/ConfigStore";
import useModal from "../modal/useModal";
import { useSnackbar } from "../snackbar/useSnackbar";
import useDispatch from "../util/redux/useDispatch";
import { SettingsEditor } from "./SettingsEditor";

export function useSettingsEditor(wournal: Wournal) {
    let openSnackBar = useSnackbar()[0];
    let openModal = useModal();

    const themeCtx = useContext(ThemeContext);
    const dispatch = useDispatch(ConfigStoreCtx);

    return () => {
        dispatch(ConfigStore_SetTmp(Wournal.CONF));

        openModal(
            <SettingsEditor/>,
            "Settings", [
            {
                name: "Save", close: true, action: async () => {
                    dispatch(ConfigStore_SaveConfig({wournal}));
                    themeCtx.setTheme(Wournal.CONF.theme);
                    openSnackBar("Configuration Saved");
                }, style: "primary"
            }, {
                name: "Close", close: true, action: () => null, style: "default"
            }
        ]
        );
    }
}
