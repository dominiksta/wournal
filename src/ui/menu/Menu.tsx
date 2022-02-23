import { useContext } from "react";
import { CanvasTool, CanvasToolName } from "../../document/CanvasTool";
import { CanvasToolEraser } from "../../document/CanvasToolEraser";
import { CanvasToolImage } from "../../document/CanvasToolImage";
import { CanvasToolPen } from "../../document/CanvasToolPen";
import { CanvasToolRectangle } from "../../document/CanvasToolRectangle";
import { CanvasToolSelectRectangle } from "../../document/CanvasToolSelectRectangle";
import { CanvasToolText } from "../../document/CanvasToolText";
import { Wournal } from "../../document/Wournal";
import { CanvasToolStrokeWidth } from "../../persistence/ConfigDTO";
import { useForceUpdate } from "../../useForceUpdate";
import { ThemeContext } from "../App";
import { useSnackbar } from "../snackbar/useSnackbar";
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
    wournal, hidden, currentTool, currStrokeWidth, selectionAvailable,
    undoAvailable, redoAvailable
}: {
    wournal: Wournal, hidden: boolean, currentTool: string,
    currStrokeWidth: CanvasToolStrokeWidth, selectionAvailable: boolean,
    undoAvailable: boolean, redoAvailable: boolean
}
) {
    const forceUpdate = useForceUpdate();
    const openSnackbar = useSnackbar()[0];
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
                        text="Save"/>
                    <MenuItem
                        mark="res/remix/file-line.svg"
                        fun={() => wournal.loadDocument(true)}
                        text="New"/>
                    <MenuItem
                        mark="res/remix/folder-open-line.svg"
                        fun={() => wournal.loadDocument()}
                        text="Open"/>
                </SubMenu>
                <SubMenu text="Edit">
                    <MenuItem
                        mark="res/remix/arrow-go-back-line.svg"
                        fun={() => wournal.doc.undo()}
                        disabled={!undoAvailable}
                        text="Undo"/>
                    <MenuItem
                        mark="res/remix/arrow-go-forward-line.svg"
                        fun={() => wournal.doc.redo()}
                        disabled={!redoAvailable}
                        text="Redo"/>
                    <MenuItem
                        mark="res/remix/scissors-2-line.svg"
                        fun={() => wournal.doc.selectionCut()}
                        disabled={!selectionAvailable}
                        text="Cut"/>
                    <MenuItem
                        mark="res/remix/file-copy-line.svg"
                        fun={() => wournal.doc.selectionCopy()}
                        disabled={!selectionAvailable}
                        text="Copy"/>
                    <MenuItem
                        mark="res/remix/clipboard-line.svg"
                        fun={() => wournal.doc.selectionOrClipboardPaste()}
                        text="Paste" />
                </SubMenu>
                <SubMenu text="View">
                    <MenuItem
                        mark="res/material/magnify-plus-outline.svg"
                        fun={() => wournal.doc.setZoom(wournal.doc.getZoom() + 0.1)}
                        text="Zoom In" />
                    <MenuItem
                        mark="res/material/magnify-zero-outline.svg"
                        fun={() => wournal.doc.setZoom(1)}
                        text="Reset Zoom" />
                    <MenuItem
                        mark="res/material/magnify-minus-outline.svg"
                        fun={() => wournal.doc.setZoom(wournal.doc.getZoom() - 0.1)}
                        text="Zoom Out" />
                </SubMenu>
                <SubMenu text="Tool">
                    <MenuItem
                        mark="res/custom/pen.svg"
                        fun={() => wournal.doc.setTool(CanvasToolPen)}
                        active={currentTool === "CanvasToolPen"}
                        text="Pen" />
                    <MenuItem
                        mark="res/material/selection-drag.svg"
                        fun={() => wournal.doc.setTool(CanvasToolSelectRectangle)}
                        active={currentTool === "CanvasToolSelectRectangle"}
                        text="Select Rectangle" />
                    <MenuItem
                        mark="res/remix/text.svg"
                        fun={() => wournal.doc.setTool(CanvasToolText)}
                        active={currentTool === "CanvasToolText"}
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
                        text="Eraser" />
                    <MenuItem
                        mark="res/material/rectangle-outline.svg"
                        fun={() => wournal.doc.setTool(CanvasToolRectangle)}
                        active={currentTool === "CanvasToolRectangle"}
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
                            await wournal.saveConfig();
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
