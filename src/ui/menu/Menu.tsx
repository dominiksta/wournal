import { useContext } from "react";
import { CanvasTool, CanvasToolName } from "../../document/CanvasTool";
import { CanvasToolEraser } from "../../document/CanvasToolEraser";
import { CanvasToolImage } from "../../document/CanvasToolImage";
import { CanvasToolPen } from "../../document/CanvasToolPen";
import { CanvasToolRectangle } from "../../document/CanvasToolRectangle";
import { CanvasToolSelectRectangle } from "../../document/CanvasToolSelectRectangle";
import { CanvasToolText } from "../../document/CanvasToolText";
import { Wournal } from "../../document/Wournal";
import { CanvasToolStrokeWidth, ConfigDTO } from "../../persistence/ConfigDTO";
import { ThemeContext } from "../App";
import { useSettingsEditor } from "../settings/useSettingsEditor";
import { useSnackbar } from "../snackbar/useSnackbar";
import { useForceUpdate } from "../util/useForceUpdate";
import "./Menu.css";
import MenuColorItems from "./MenuColorItem";
import MenuItem from "./MenuItem";
import SubMenu from "./SubMenu";

/**
 * The main application menu. Comparable to a MenuBar in a traditional desktop
 * application, except deeper levels of the menu don't display on hover but
 * instead replace the current menu on click. This design should be a lot more
 * usable on mobile while still providing the same functionality.
 */
export default function Menu({
    wournal, loadDocument, hidden, currentTool, currStrokeWidth,
    selectionAvailable, undoAvailable, redoAvailable
}: {
    wournal: Wournal, loadDocument: (emtpy: boolean) => void,
    hidden: boolean, currentTool: string,
    currStrokeWidth: CanvasToolStrokeWidth, selectionAvailable: boolean,
    undoAvailable: boolean, redoAvailable: boolean
}
) {
    const forceUpdate = useForceUpdate();
    const openSnackbar = useSnackbar()[0];
    const openSettingsEditor = useSettingsEditor(
        Wournal.CONF,
        (async (dto: ConfigDTO) => {
            await wournal.saveConfig(dto);
            await wournal.loadConfig();
        }).bind(wournal)
    );
    const themeCtx = useContext(ThemeContext);

    function btnMapping2(name: CanvasToolName) {
        return (
            <MenuItem
                mark={Wournal.CONF.binds.rightClick === name ? "dot" : ""}
                fun={() => {
                    Wournal.CONF.binds.rightClick = name;
                    forceUpdate();
                }}
                text={CanvasTool.humanName(name)}
            />
        );
    }

    return (
        <div className="Menu" hidden={hidden}
            style={{filter: themeCtx.darkTheme ? "invert(1)" : ""}}>
            {/* _ROOT_ is not a special symbol, it can be called anything really */}
            <SubMenu text="_ROOT_" root={true}>
                <SubMenu text="File">
                    <MenuItem
                        mark="res/remix/save-3-line.svg"
                        fun={() => wournal.saveDocument()}
                        shortcut="Ctrl+S"
                        text="Save"/>
                    <MenuItem
                        mark="res/remix/file-line.svg"
                        fun={() => loadDocument(true)}
                        shortcut="Alt+N"
                        text="New"/>
                    {/* Ctrl+n is blocked by browser */}
                    <MenuItem
                        mark="res/remix/folder-open-line.svg"
                        fun={() => loadDocument(false)}
                        shortcut="Ctrl+O"
                        text="Open"/>
                </SubMenu>
                <SubMenu text="Edit">
                    <MenuItem
                        mark="res/remix/arrow-go-back-line.svg"
                        fun={() => wournal.doc.undo()}
                        disabled={!undoAvailable}
                        shortcut="Ctrl+Z"
                        text="Undo"/>
                    <MenuItem
                        mark="res/remix/arrow-go-forward-line.svg"
                        fun={() => wournal.doc.redo()}
                        disabled={!redoAvailable}
                        shortcut="Ctrl+Y"
                        text="Redo"/>
                    <MenuItem
                        mark="res/remix/scissors-2-line.svg"
                        fun={() => wournal.doc.selectionCut()}
                        shortcut="Ctrl+X"
                        disabled={!selectionAvailable}
                        text="Cut"/>
                    <MenuItem
                        mark="res/remix/file-copy-line.svg"
                        fun={() => wournal.doc.selectionCopy()}
                        shortcut="Ctrl+C"
                        disabled={!selectionAvailable}
                        text="Copy"/>
                    <MenuItem
                        fun={() => wournal.doc.selectionCut(true)}
                        shortcut="Delete"
                        disabled={!selectionAvailable}
                        text="Delete"/>
                    {/* This does not get an explicit Ctrl+V bind, because we
                    use the `paste` event to capture the system
                    clipboard. Technically, there is an api to access the system
                    clipboard, but it seems like it isn't quite standardized and
                    requires asking for permissions, so the paste event seems
                    like a better option for now. See `ClipboardUtils`. */}
                    <MenuItem
                        mark="res/remix/clipboard-line.svg"
                        fun={() => wournal.doc.selectionOrClipboardPaste()}
                        text="Paste" />
                    <MenuItem
                        fun={() => openSettingsEditor()}
                        shortcut="Ctrl+,"
                        text="Preferences"/>
                </SubMenu>
                <SubMenu text="View">
                    <MenuItem
                        mark="res/material/magnify-plus-outline.svg"
                        fun={() => wournal.doc.setZoom(wournal.doc.getZoom() + 0.1)}
                        shortcut="Ctrl++"
                        text="Zoom In" />
                    <MenuItem
                        mark="res/material/magnify-zero-outline.svg"
                        fun={() => wournal.doc.setZoom(1)}
                        shortcut="Ctrl+0"
                        text="Reset Zoom" />
                    <MenuItem
                        mark="res/material/magnify-minus-outline.svg"
                        fun={() => wournal.doc.setZoom(wournal.doc.getZoom() - 0.1)}
                        shortcut="Ctrl+-"
                        text="Zoom Out" />
                </SubMenu>
                <SubMenu text="Tool">
                    <MenuItem
                        mark="res/custom/pen.svg"
                        fun={() => wournal.doc.setTool(CanvasToolPen)}
                        active={currentTool === "CanvasToolPen"}
                        shortcut="W"
                        text="Pen" />
                    <MenuItem
                        mark="res/material/selection-drag.svg"
                        fun={() => wournal.doc.setTool(CanvasToolSelectRectangle)}
                        active={currentTool === "CanvasToolSelectRectangle"}
                        shortcut="S"
                        text="Select Rectangle" />
                    <MenuItem
                        mark="res/remix/text.svg"
                        fun={() => wournal.doc.setTool(CanvasToolText)}
                        active={currentTool === "CanvasToolText"}
                        shortcut="T"
                        text="Insert Textbox" />
                    <MenuItem
                        mark="res/remix/image-add-line.svg"
                        fun={() => wournal.doc.setTool(CanvasToolImage)}
                        active={currentTool === "CanvasToolImage"}
                        text="Insert Image File" />
                    <MenuItem
                        mark="res/remix/eraser-line.svg"
                        fun={() => wournal.doc.setTool(CanvasToolEraser)}
                        active={currentTool === "CanvasToolEraser"}
                        shortcut="E"
                        text="Eraser" />
                    <MenuItem
                        mark="res/material/rectangle-outline.svg"
                        fun={() => wournal.doc.setTool(CanvasToolRectangle)}
                        active={currentTool === "CanvasToolRectangle"}
                        shortcut="R"
                        text="Draw Rectangle" />
                    <SubMenu text="Color">
                        <MenuColorItems
                            colors={Wournal.CONF.colorPalette}
                            currentColor={wournal.doc.getColor()}
                            setColor={(color: string) => {
                                wournal.doc.setColor(color);
                                forceUpdate();
                            }} />
                    </SubMenu>
                    <SubMenu text="Pen Options">
                        <MenuItem
                            mark={currStrokeWidth === "fine" ? "dot" : ""}
                            fun={() => {
                                wournal.doc.setStrokeWidth("fine");
                                forceUpdate();
                            }}
                            text="Fine" />
                        <MenuItem
                            mark={currStrokeWidth === "medium" ? "dot" : ""}
                            fun={() => {
                                wournal.doc.setStrokeWidth("medium");
                                forceUpdate();
                            }}
                            text="Medium" />
                        <MenuItem
                            mark={currStrokeWidth === "thick" ? "dot" : ""}
                            fun={() => {
                                wournal.doc.setStrokeWidth("thick");
                                forceUpdate();
                            }}
                            text="Thick" />
                    </SubMenu>
                    <SubMenu text="Eraser Options">
                        <MenuItem
                            mark={Wournal.currToolConf.CanvasToolEraser.eraseStrokes
                                ? "dot" : ""}
                            fun={() => {
                                Wournal.currToolConf.CanvasToolEraser.eraseStrokes = true;
                                forceUpdate();
                            }}
                            text="Erase Strokes"/>
                        <MenuItem
                            mark={Wournal.currToolConf.CanvasToolEraser.eraseStrokes
                                ? "" : "dot"}
                            fun={() => {
                                Wournal.currToolConf.CanvasToolEraser.eraseStrokes = false;
                                forceUpdate();
                            }}
                            text="Erase Points"/>
                    </SubMenu>
                    <MenuItem
                        mark="res/material/autorenew.svg"
                        fun={() => {
                            wournal.doc.resetCurrentTool();
                            forceUpdate();
                        }}
                        text="Default Tool Options"/>
                    <MenuItem
                        mark="res/custom/default-pen.svg"
                        fun={() => {
                            wournal.doc.setTool(CanvasToolPen);
                            wournal.doc.resetCurrentTool();
                            forceUpdate();
                        }}
                        text="Default Pen"/>
                    <MenuItem
                        fun={() => wournal.doc.setCurrentToolAsDefault()}
                        text="Set as Default"/>
                </SubMenu>
                <SubMenu text="Option">
                    <MenuItem
                        fun={async () => {
                            await wournal.saveConfig(Wournal.CONF);
                            openSnackbar("Configuration Saved", 1000);
                        }}
                        text="Save Configuration"/>
                    <SubMenu text="Button 2 Mapping">
                        {btnMapping2("CanvasToolPen")}
                        {btnMapping2("CanvasToolSelectRectangle")}
                        {btnMapping2("CanvasToolEraser")}
                        {btnMapping2("CanvasToolRectangle")}
                    </SubMenu>
                    <SubMenu text="Theme">
                        <MenuItem
                            mark={Wournal.CONF.theme === "auto" ? "dot" : ""}
                            fun={() => themeCtx.setTheme("auto")}
                            text="Auto/System Invert"/>
                        <MenuItem
                            mark={Wournal.CONF.theme === "light" ? "dot" : ""}
                            fun={() => themeCtx.setTheme("light")}
                            text="Light"/>
                        <MenuItem
                            mark={Wournal.CONF.theme === "dark" ? "dot" : ""}
                            fun={() => themeCtx.setTheme("dark")}
                            text="Invert"/>
                    </SubMenu>
                </SubMenu>
                <SubMenu text="Test">
                    <SubMenu text="Deeper Nest 1">
                        <MenuItem
                            mark="res/remix/save-3-line.svg"
                            fun={() => null}
                            text="Test 1" />
                        <MenuItem
                            mark="res/remix/save-3-line.svg"
                            fun={() => null}
                            text="Test 2" />
                        <MenuItem
                            mark="res/remix/save-3-line.svg"
                            fun={() => null}
                            text="Test 3" />
                    </SubMenu>
                    <SubMenu text="Deeper Nest 2">
                        <MenuItem
                            mark="res/remix/save-3-line.svg"
                            fun={() => null}
                            text="Test 3" />
                        <MenuItem
                            mark="res/remix/save-3-line.svg"
                            fun={() => null}
                            text="Test 4" />
                        <MenuItem
                            mark="res/remix/save-3-line.svg"
                            fun={() => null}
                            text="Test 5" />
                    </SubMenu>
                </SubMenu>
            </SubMenu>
        </div>
    );
}
