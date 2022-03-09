import { ConfigStoreCtx, ConfigStore_SetTheme } from "../global-state/ConfigStore";
import { Option, Select } from "../select";
import useDispatch from "../util/redux/useDispatch";
import useSelector from "../util/redux/useSelector";
import "./ColorPaletteEditor.css";

export default function ThemeSettingsEditor() {
    const theme = useSelector(ConfigStoreCtx, s => s.tmp.theme);
    const dispatch = useDispatch(ConfigStoreCtx);

    return (
        <section className="wournal-settings-section wournal-settings-color">
            <Select value={theme} width="180px" imgSpace={false}
                onChange={(t) => {
                    dispatch(ConfigStore_SetTheme(
                        {theme: t as "dark" | "light" | "auto"})
                    );
                }}>
                <Option value="light">Light</Option>
                <Option value="dark">Invert</Option>
                <Option value="auto">Auto/System Invert</Option>
            </Select>
        </section>
    );

}
