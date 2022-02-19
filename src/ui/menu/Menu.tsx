import { CanvasToolEraser } from "../../document/CanvasToolEraser";
import { CanvasToolPen } from "../../document/CanvasToolPen";
import { CanvasToolRectangle } from "../../document/CanvasToolRectangle";
import { CanvasToolSelectRectangle } from "../../document/CanvasToolSelectRectangle";
import { CanvasToolText } from "../../document/CanvasToolText";
import { Wournal } from "../../document/Wournal";
import "./Menu.css";
import MenuItem from "./MenuItem";
import SubMenu from "./SubMenu";

/**
 * The main application menu. Comparable to a MenuBar in a traditional desktop
 * application, except deeper levels of the menu don't display on hover but
 * instead replace the current menu on click. This design should be a lot more
 * usable on mobile while still providing the same functionality.
 */
export default function Menu({ wournal, hidden }: { wournal: Wournal, hidden: boolean }) {
    return (
        <div className="Menu" hidden={hidden}>
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
                        text="Undo"/>
                    <MenuItem
                        mark="res/remix/arrow-go-forward-line.svg"
                        fun={() => wournal.doc.redo()}
                        text="Redo"/>
                    <MenuItem
                        mark="res/remix/scissors-2-line.svg"
                        fun={() => wournal.doc.selectionCut()}
                        text="Cut" />
                    <MenuItem
                        mark="res/remix/file-copy-line.svg"
                        fun={() => wournal.doc.selectionCopy()}
                        text="Copy" />
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
                        fun={() => wournal.doc.setTool(new CanvasToolPen())}
                        text="Pen" />
                    <MenuItem
                        mark="res/material/selection-drag.svg"
                        fun={() => wournal.doc.setTool(new CanvasToolSelectRectangle())}
                        text="Select Rectangle" />
                    <MenuItem
                        mark="res/remix/text.svg"
                        fun={() => wournal.doc.setTool(new CanvasToolText())}
                        text="Insert Textbox" />
                    <MenuItem
                        mark="res/remix/eraser-line.svg"
                        fun={() => wournal.doc.setTool(new CanvasToolEraser(10, false))}
                        text="Point Eraser" />
                    <MenuItem
                        mark="res/remix/eraser-line.svg"
                        fun={() => wournal.doc.setTool(new CanvasToolEraser(10, true))}
                        text="Stroke Eraser" />
                    <MenuItem
                        mark="res/material/rectangle-outline.svg"
                        fun={() => wournal.doc.setTool(new CanvasToolRectangle())}
                        text="Draw Rectangle" />
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
