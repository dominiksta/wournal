import { CanvasToolTextConfig } from "../../persistence/ConfigDTO";
import { CurrentToolConfigStoreCtx, CurrentToolConfigStore_SetCanvasToolTextConfig } from "../global-state/CurrentToolConfigStore";
import useDispatch from "../util/redux/useDispatch";
import useSelector from "../util/redux/useSelector";
import FontPicker from "./FontPicker";

/** A font picker for the currently selected font */
export default function CurrentFontPicker() {
    const config = useSelector(CurrentToolConfigStoreCtx, s => s.CanvasToolText);
    const dispatch = useDispatch(CurrentToolConfigStoreCtx);

    const setConfig = (c: CanvasToolTextConfig) => {
        dispatch(CurrentToolConfigStore_SetCanvasToolTextConfig(c))
    }

    return (
        <FontPicker config={config} onChange={setConfig}/>
    );
}
