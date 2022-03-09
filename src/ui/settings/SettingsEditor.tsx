import Collapsible from "../collabsible/Collapsible";
import ColorPaletteEditor from "./ColorPaletteEditor";
import DefaultToolSettingsEditor from "./DefaultToolSettingsEditor";
import MouseButtonEditor from "./MouseButtonEditor";
import "./SettingsEditor.css";
import ThemeSettingsEditor from "./ThemeSettingsEditor";

export function SettingsEditor() {
    return (
        <div className="wournal-settings">
            <div className="wournal-settings-row">
                <Collapsible title="Color Palette">
                    <ColorPaletteEditor/>
                </Collapsible>
            </div>
            <div className="wournal-settings-row">
                <Collapsible title="Theme">
                    <ThemeSettingsEditor/>
                </Collapsible>
                <Collapsible title="Mouse Buttons">
                    <MouseButtonEditor/>
                </Collapsible>
                <Collapsible title="Default Tool Options">
                    <DefaultToolSettingsEditor/>
                </Collapsible>
            </div>
        </div>
    );
}
