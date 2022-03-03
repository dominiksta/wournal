import { CanvasToolName } from "../../document/CanvasTool";
import { ConfigDTO } from "../../persistence/ConfigDTO";
import Collapsible from "../collabsible/Collapsible";
import { ObjWithSetter } from "../util/ObjWithSetter";
import ColorPaletteEditor from "./ColorPaletteEditor";
import MouseButtonEditor from "./MouseButtonEditor";
import "./SettingsEditor.css";
import ThemeSettingsEditor from "./ThemeSettingsEditor";

export function SettingsEditor({
    config,
}: {
    /** The config to display/edit. The setter should be used to "commit" any
    changes to the config such that they would be saved if the user clicks
    "Save" in the modal. */
    config: ObjWithSetter<ConfigDTO>,
}) {
    /* Note that we do not store the config as a component state here. This is
    to avoid re-rendering the entire settings editor when only one setting
    changes. Therefore, individual sub-components are necessary to edit
    individual settings. */

    const colors = {
        value: config.value.colorPalette,
        setValue: (c: { color: string, name: string }[]) => {
            config.value.colorPalette = c;
            config.setValue(config.value);
        }
    };

    const theme = {
        value: config.value.theme,
        setValue: (t: "dark" | "light" | "auto") => {
            config.value.theme = t;
            config.setValue(config.value);
        }
    };

    const rightClick = {
        value: config.value.binds.rightClick,
        setValue: (r: CanvasToolName) => {
            config.value.binds.rightClick = r;
            config.setValue(config.value);
        }
    };

    return (
        <div className="wournal-settings">
            <div className="wournal-settings-row">
                <Collapsible title="Color Palette">
                    <ColorPaletteEditor colors={colors} />
                </Collapsible>
            </div>
            <div className="wournal-settings-row">
                <Collapsible title="Theme">
                    <ThemeSettingsEditor theme={theme} />
                </Collapsible>
                <Collapsible title="Mouse Buttons">
                    <MouseButtonEditor rightClick={rightClick}/>
                </Collapsible>
            </div>
        </div>
    );
}
