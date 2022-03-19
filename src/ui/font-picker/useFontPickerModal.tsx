import { Wournal } from "../../document/Wournal";
import { CurrentToolConfigStoreCtx, CurrentToolConfigStore_Apply, CurrentToolConfigStore_SetCanvasToolTextConfig } from "../global-state/CurrentToolConfigStore";
import useModal from "../modal/useModal";
import useDispatch from "../util/redux/useDispatch";
import ConfigFontPicker from "./ConfigFontPicker";
import CurrentFontPicker from "./CurrentFontPicker";

export default function useFontPickerModal(t: "config" | "current") {
    const openModal = useModal();

    const dispatch = useDispatch(CurrentToolConfigStoreCtx);

    return () => {
        dispatch(CurrentToolConfigStore_SetCanvasToolTextConfig(
            Wournal.currToolConf.CanvasToolText
        ));

        if (t === "config") {
            openModal(
                <ConfigFontPicker />,
                "Select Font",
                [
                    {
                        name: "OK", close: true, action: () => null, style: "primary"
                    },
                ]
            )
        } else {
            openModal(
                <CurrentFontPicker />,
                "Select Font",
                [
                    {
                        name: "OK", close: true, action: () => {
                            dispatch(CurrentToolConfigStore_Apply())
                        },
                        style: "primary"
                    },
                    {
                        name: "Close", close: true, action: () => null, style: "default"
                    }
                ]
            );
        }
    };
}
