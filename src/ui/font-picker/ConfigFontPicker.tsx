import { CanvasToolTextConfig } from "../../persistence/ConfigDTO";
import { ConfigStoreCtx, ConfigStore_SetCanvasToolConfig } from "../global-state/ConfigStore";
import { CurrentToolConfigStoreCtx, CurrentToolConfigStore_SetCanvasToolTextConfig } from "../global-state/CurrentToolConfigStore";
import useDispatch from "../util/redux/useDispatch";
import useSelector from "../util/redux/useSelector";
import FontPicker from "./FontPicker";

/** A font picker for the configured font */
export default function ConfigFontPicker() {
    const config = useSelector(ConfigStoreCtx, s => s.tmp.tools);
    const dispatch = useDispatch(ConfigStoreCtx);

    const setConfig = (c: CanvasToolTextConfig) => {
        config.CanvasToolText = c;
        dispatch(ConfigStore_SetCanvasToolConfig(config))
    }

    return (
        <FontPicker config={config.CanvasToolText} onChange={setConfig}/>
    );
}
