import { useState } from 'react';
import { CanvasToolEraser } from '../../document/CanvasToolEraser';
import { CanvasToolPen } from '../../document/CanvasToolPen';
import { CanvasToolRectangle } from '../../document/CanvasToolRectangle';
import { CanvasToolSelectRectangle } from '../../document/CanvasToolSelectRectangle';
import { CanvasToolText } from '../../document/CanvasToolText';
import { Wournal } from '../../document/Wournal';
import { useForceUpdate } from '../../useForceUpdate';
import Menu from '../menu/Menu';
import './Toolbar.css';
import ToolbarButton from './ToolbarButton';
import ToolbarGroup from './ToolbarGroup';

function Toolbar({wournal}: {wournal: Wournal}) {
    const [currentTool, setCurrentTool] = useState("CanvasToolPen");
    const [selectionAvailable, setSelectionAvailable] = useState(false);
    const [undoAvailable, setUndoAvailable] = useState(false);
    const [redoAvailable, setRedoAvailable] = useState(false);
    const forceUpdate = useForceUpdate();

    wournal.doc.notifyUndoAvailable = setUndoAvailable;
    wournal.doc.notifyRedoAvailable = setRedoAvailable;
    wournal.doc.notifySelectionAvailable = setSelectionAvailable;
    wournal.doc.notifySetTool = setCurrentTool;

    const loadDocument = (empty: boolean) => {
        wournal.loadDocument(empty);
        setUndoAvailable(false);
        setRedoAvailable(false);
        setSelectionAvailable(false);
        setCurrentTool("CanvasToolPen");
        /* if the state has not changed from default, we still have to force an
        update to set the notify* functions correctly */
        forceUpdate();
    };

    const [hideMenu, setHideMenu] = useState(true);
    const menu = Menu({
        wournal: wournal, currentTool: currentTool,
        hidden: hideMenu, selectionAvailable: selectionAvailable,
        undoAvailable: undoAvailable, redoAvailable: redoAvailable
    });

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
                    fun={() => loadDocument(true)}
                    alt="Load"/>
                <ToolbarButton
                    img="res/remix/folder-open-line.svg"
                    fun={() => loadDocument(false)}
                    alt="Open File" />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/custom/pen.svg"
                    fun={() => wournal.doc.setTool(new CanvasToolPen())}
                    current={currentTool === "CanvasToolPen"}
                    alt="Pen"/>
                <ToolbarButton
                    img="res/material/selection-drag.svg"
                    fun={() => wournal.doc.setTool(new CanvasToolSelectRectangle())}
                    current={currentTool === "CanvasToolSelectRectangle"}
                    alt="Select Rectangle"/>
                <ToolbarButton
                    img="res/remix/text.svg"
                    fun={() => wournal.doc.setTool(new CanvasToolText())}
                    current={currentTool === "CanvasToolText"}
                    alt="Insert Textbox"/>
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={() => wournal.doc.setTool(new CanvasToolEraser(10, false))}
                    current={currentTool === "CanvasToolEraser"}
                    alt="Point Eraser"/>
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={() => wournal.doc.setTool(new CanvasToolEraser(10, true))}
                    current={currentTool === "CanvasToolEraser"}
                    alt="Stroke Eraser"/>
                <ToolbarButton
                    img="res/material/rectangle-outline.svg"
                    fun={() => wournal.doc.setTool(new CanvasToolRectangle())}
                    current={currentTool === "CanvasToolRectangle"}
                    alt="Draw Rectangle"/>
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/arrow-go-back-line.svg"
                    disabled={!undoAvailable}
                    fun={() => wournal.doc.undo()}
                    alt="Undo"/>
                <ToolbarButton
                    img="res/remix/arrow-go-forward-line.svg"
                    disabled={!redoAvailable}
                    fun={() => wournal.doc.redo()}
                    alt="Redo" />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/scissors-2-line.svg"
                    disabled={!selectionAvailable}
                    fun={() => wournal.doc.selectionCut()}
                    alt="Cut Selection"/>
                <ToolbarButton
                    img="res/remix/file-copy-line.svg"
                    disabled={!selectionAvailable}
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
