import { Option, Select } from "../select";
import { ObjWithSetter } from "../util/ObjWithSetter";
import { useStateWithSetter } from "../util/useStateWithSetter";
import "./ColorPaletteEditor.css";

export default function ThemeSettingsEditor({
    theme,
}: {
    theme: ObjWithSetter<"dark" | "light" | "auto">
}) {
    const [themeInternal, commitTheme] = useStateWithSetter(theme);

    return (
        <section className="wournal-settings-section wournal-settings-color">
            <Select value={themeInternal} width="180px" imgSpace={false}
                onChange={(t) => {
                    commitTheme(t as "dark" | "light" | "auto");
                }}>
                <Option value="light">Light</Option>
                <Option value="dark">Invert</Option>
                <Option value="auto">Auto/System Invert</Option>
            </Select>
        </section>
    );

}
