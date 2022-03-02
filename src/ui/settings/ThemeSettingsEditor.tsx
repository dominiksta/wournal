import { useContext } from "react";
import { DSUtils } from "../../util/DSUtils";
import { ThemeContext } from "../App";
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
            <select value={themeInternal} onChange={(e) => {
                commitTheme(e.target.value as "dark" | "light" | "auto");
            }}>
                <option value="light">Light</option>
                <option value="dark">Invert</option>
                <option value="auto">Auto/System Invert</option>
            </select>
        </section>
    );

}
