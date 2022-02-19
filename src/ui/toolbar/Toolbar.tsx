import { useState } from 'react';
import { CanvasTool } from '../../document/CanvasTool';
import { CanvasToolEraser } from '../../document/CanvasToolEraser';
import { CanvasToolPen } from '../../document/CanvasToolPen';
import { CanvasToolRectangle } from '../../document/CanvasToolRectangle';
import { CanvasToolSelectRectangle } from '../../document/CanvasToolSelectRectangle';
import { CanvasToolText } from '../../document/CanvasToolText';
import { Wournal } from '../../document/Wournal';
import Menu from '../menu/Menu';
import './Toolbar.css';
import ToolbarButton from './ToolbarButton';
import ToolbarGroup from './ToolbarGroup';

function Toolbar({wournal}: {wournal: Wournal}) {

    const [currentTool, setCurrentTool] = useState("CanvasToolPen");

    const setTool = (tool: CanvasTool) => {
        return () => {
            setCurrentTool(tool.name)
            wournal.doc.setTool(tool)
        };
    }

    const [hideMenu, setHideMenu] = useState(true);
    const menu = Menu({wournal: wournal, hidden: hideMenu});

    return (
        <div className="Toolbar">
            {menu}
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/menu-line.svg"
                    fun={() => setHideMenu(!hideMenu)}
                    alt="Menu"/>
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/save-3-line.svg"
                    fun={() => wournal.saveDocument()}
                    alt="Save"/>
                <ToolbarButton
                    img="res/remix/file-line.svg"
                    fun={() => wournal.loadDocument(true)}
                    alt="Load"/>
                <ToolbarButton
                    img="res/remix/folder-open-line.svg"
                    fun={() => wournal.loadDocument()}
                    alt="Open File" />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/custom/pen.svg"
                    fun={setTool(new CanvasToolPen())}
                    current={currentTool === "CanvasToolPen"}
                    alt="Pen"/>
                <ToolbarButton
                    img="res/material/selection-drag.svg"
                    fun={setTool(new CanvasToolSelectRectangle())}
                    current={currentTool === "CanvasToolSelectRectangle"}
                    alt="Select Rectangle"/>
                <ToolbarButton
                    img="res/remix/text.svg"
                    fun={setTool(new CanvasToolText())}
                    current={currentTool === "CanvasToolText"}
                    alt="Insert Textbox"/>
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={setTool(new CanvasToolEraser(10, false))}
                    current={currentTool === "CanvasToolEraser"}
                    alt="Point Eraser"/>
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={setTool(new CanvasToolEraser(10, true))}
                    current={currentTool === "CanvasToolEraser"}
                    alt="Stroke Eraser"/>
                <ToolbarButton
                    img="res/material/rectangle-outline.svg"
                    fun={setTool(new CanvasToolRectangle())}
                    current={currentTool === "CanvasToolRectangle"}
                    alt="Draw Rectangle"/>
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/arrow-go-back-line.svg"
                    fun={() => wournal.doc.undo()}
                    alt="Undo"/>
                <ToolbarButton
                    img="res/remix/arrow-go-forward-line.svg"
                    fun={() => wournal.doc.redo()}
                    alt="Redo" />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/scissors-2-line.svg"
                    fun={() => wournal.doc.selectionCut()}
                    alt="Cut Selection" />
                <ToolbarButton
                    img="res/remix/file-copy-line.svg"
                    fun={() => wournal.doc.selectionCopy()}
                    alt="Copy Selection"/>
                <ToolbarButton
                    img="res/remix/clipboard-line.svg"
                    fun={() => wournal.doc.selectionOrClipboardPaste()}
                    alt="Paste Selection/Clipboard" />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/material/magnify-plus-outline.svg"
                    fun={() => wournal.doc.setZoom(wournal.doc.getZoom() + 0.1)}
                    alt="Zoom In"/>
                <ToolbarButton
                    img="res/material/magnify-zero-outline.svg"
                    fun={() => wournal.doc.setZoom(1)}
                    alt="Reset Zoom"/>
                <ToolbarButton
                    img="res/material/magnify-minus-outline.svg"
                    fun={() => wournal.doc.setZoom(wournal.doc.getZoom() - 0.1)}
                    alt="Zoom Out"/>
            </ToolbarGroup>
        </div>
    );
}

export default Toolbar;
