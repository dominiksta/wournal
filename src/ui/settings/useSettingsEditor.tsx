import { ConfigDTO } from "../../persistence/ConfigDTO";
import { DSUtils } from "../../util/DSUtils";
import useModal from "../modal/useModal";
import { useSnackbar } from "../snackbar/useSnackbar";
import { ObjWithSetter } from "../util/ObjWithSetter";
import { SettingsEditor } from "./SettingsEditor";

export function useSettingsEditor(
    config: ConfigDTO,
    saveConfig: (dto: ConfigDTO) => Promise<void>
) {
    let openSnackBar = useSnackbar()[0];
    let openModal = useModal();

    return () => {
        const conf: ObjWithSetter<ConfigDTO> = {
            /* save a copy of the current config so that closing the settings
             editor is equivalent to cancellying in that it does not save the
             config */
            value: DSUtils.copyObj(config),
            setValue: (c: ConfigDTO) => { conf.value = c; }
        }

        openModal(
            <SettingsEditor config={conf} />,
            "Settings", [
            {
                name: "Save", close: true, action: async () => {
                    await saveConfig(conf.value);
                    openSnackBar("Configuration Saved");
                }, style: "primary"
            }, {
                name: "Close", close: true, action: () => null, style: "default"
            }
        ]
        );
    }
}
