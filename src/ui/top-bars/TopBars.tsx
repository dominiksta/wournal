import { useState } from 'react';
import { CanvasToolEraser } from '../../document/CanvasToolEraser';
import { CanvasToolImage } from '../../document/CanvasToolImage';
import { CanvasToolPen } from '../../document/CanvasToolPen';
import { CanvasToolRectangle } from '../../document/CanvasToolRectangle';
import { CanvasToolSelectRectangle } from '../../document/CanvasToolSelectRectangle';
import { CanvasToolText } from '../../document/CanvasToolText';
import { Wournal } from '../../document/Wournal';
import { useForceUpdate } from '../../useForceUpdate';
import Menu from '../menu/Menu';
import { useSnackbar } from '../snackbar/useSnackbar';
import Toolbar from '../toolbar/Toolbar';
import ToolbarButton from '../toolbar/ToolbarButton';
import ToolbarColorButtons from '../toolbar/ToolbarColorButtons';
import ToolbarSeperator from '../toolbar/ToolbarSeperator';


export default function TopBars({ wournal }: { wournal: Wournal }) {
    const [currentTool, setCurrentTool] = useState("CanvasToolPen");
    const [selectionAvailable, setSelectionAvailable] = useState(false);
    const [undoAvailable, setUndoAvailable] = useState(false);
    const [redoAvailable, setRedoAvailable] = useState(false);
    const forceUpdate = useForceUpdate();
    const openSnackbar = useSnackbar()[0];

    wournal.doc.notifyUndoAvailable = setUndoAvailable;
    wournal.doc.notifyRedoAvailable = setRedoAvailable;
    wournal.doc.notifySelectionAvailable = setSelectionAvailable;
    wournal.doc.notifySetTool = setCurrentTool;

    const loadDocument = async (empty: boolean) => {
        await wournal.loadDocument(empty);
        setUndoAvailable(false);
        setRedoAvailable(false);
        setSelectionAvailable(false);
        setCurrentTool("CanvasToolPen");
        /* if the state has not changed from default, we still have to force an
        update to set the notify* functions correctly */
        forceUpdate();
    };

    const currStrokeWidth = wournal.doc.getStrokeWidth();

    const [hideMenu, setHideMenu] = useState(true);
    const menu = Menu({
        wournal: wournal, currentTool: currentTool,
        hidden: hideMenu, selectionAvailable: selectionAvailable,
        currStrokeWidth: currStrokeWidth, undoAvailable: undoAvailable,
        redoAvailable: redoAvailable
    });

    return (
        <div className="TopBars">
            {menu}
            <Toolbar>
                <ToolbarButton
                    img="res/remix/menu-line.svg"
                    fun={() => setHideMenu(!hideMenu)}
                    alt="Menu" />

                <ToolbarSeperator />

                <ToolbarButton
                    img="res/remix/save-3-line.svg"
                    fun={async () => {
                        await wournal.saveDocument();
                        openSnackbar("Document Saved", 500);
                    }}
                    alt="Save" />
                <ToolbarButton
                    img="res/remix/file-line.svg"
                    fun={() => loadDocument(true)}
                    alt="Load" />
                <ToolbarButton
                    img="res/remix/folder-open-line.svg"
                    fun={() => loadDocument(false)}
                    alt="Open File" />

                <ToolbarSeperator />

                <ToolbarButton
                    img="res/remix/arrow-go-back-line.svg"
                    disabled={!undoAvailable}
                    fun={() => wournal.doc.undo()}
                    alt="Undo" />
                <ToolbarButton
                    img="res/remix/arrow-go-forward-line.svg"
                    disabled={!redoAvailable}
                    fun={() => wournal.doc.redo()}
                    alt="Redo" />

                <ToolbarSeperator />

                <ToolbarButton
                    img="res/remix/scissors-2-line.svg"
                    disabled={!selectionAvailable}
                    fun={() => wournal.doc.selectionCut()}
                    alt="Cut Selection" />
                <ToolbarButton
                    img="res/remix/file-copy-line.svg"
                    disabled={!selectionAvailable}
                    fun={() => wournal.doc.selectionCopy()}
                    alt="Copy Selection" />
                <ToolbarButton
                    img="res/remix/clipboard-line.svg"
                    fun={() => wournal.doc.selectionOrClipboardPaste()}
                    alt="Paste Selection/Clipboard" />

                <ToolbarSeperator />

                <ToolbarButton
                    img="res/material/magnify-plus-outline.svg"
                    fun={() => wournal.doc.setZoom(wournal.doc.getZoom() + 0.1)}
                    alt="Zoom In" />
                <ToolbarButton
                    img="res/material/magnify-zero-outline.svg"
                    fun={() => wournal.doc.setZoom(1)}
                    alt="Reset Zoom" />
                <ToolbarButton
                    img="res/material/magnify-minus-outline.svg"
                    fun={() => wournal.doc.setZoom(wournal.doc.getZoom() - 0.1)}
                    alt="Zoom Out" />
            </Toolbar>
            <Toolbar>
                <ToolbarButton
                    img="res/custom/pen.svg"
                    fun={() => wournal.doc.setTool(CanvasToolPen)}
                    current={currentTool === "CanvasToolPen"}
                    alt="Pen" />
                <ToolbarButton
                    img="res/material/selection-drag.svg"
                    fun={() => wournal.doc.setTool(CanvasToolSelectRectangle)}
                    current={currentTool === "CanvasToolSelectRectangle"}
                    alt="Select Rectangle" />
                <ToolbarButton
                    img="res/remix/text.svg"
                    fun={() => wournal.doc.setTool(CanvasToolText)}
                    current={currentTool === "CanvasToolText"}
                    alt="Insert Textbox" />
                <ToolbarButton
                    img="res/remix/image-add-line.svg"
                    fun={() => wournal.doc.setTool(CanvasToolImage)}
                    current={currentTool === "CanvasToolImage"}
                    alt="Insert Image File" />
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={() => wournal.doc.setTool(CanvasToolEraser)}
                    current={currentTool === "CanvasToolEraser"}
                    alt="Eraser" />
                <ToolbarButton
                    img="res/material/rectangle-outline.svg"
                    fun={() => wournal.doc.setTool(CanvasToolRectangle)}
                    current={currentTool === "CanvasToolRectangle"}
                    alt="Draw Rectangle" />

                <ToolbarSeperator />

                <ToolbarButton
                    img="res/material/autorenew.svg"
                    fun={() => {
                        wournal.doc.resetCurrentTool();
                        forceUpdate();
                    }}
                    alt="Default Tool Options" />
                <ToolbarButton
                    img="res/custom/default-pen.svg"
                    fun={() => {
                        wournal.doc.setTool(CanvasToolPen);
                        wournal.doc.resetCurrentTool();
                        forceUpdate();
                    }}
                    alt="Default Pen" />

                <ToolbarSeperator />

                <ToolbarButton
                    img="res/custom/stroke-width-fine.svg"
                    width="30px"
                    current={currStrokeWidth === "fine"}
                    fun={() => {
                        wournal.doc.setStrokeWidth("fine");
                        forceUpdate();
                    }}
                    alt="Fine" />
                <ToolbarButton
                    img="res/custom/stroke-width-medium.svg"
                    width="30px"
                    current={currStrokeWidth === "medium"}
                    fun={() => {
                        wournal.doc.setStrokeWidth("medium");
                        forceUpdate();
                    }}
                    alt="Medium" />
                <ToolbarButton
                    img="res/custom/stroke-width-thick.svg"
                    width="30px"
                    current={currStrokeWidth === "thick"}
                    fun={() => {
                        wournal.doc.setStrokeWidth("thick");
                        forceUpdate();
                    }}
                    alt="Thick" />

                <ToolbarSeperator/>

                <ToolbarColorButtons
                    colors={Wournal.CONF.colorPalette}
                    currentColor={wournal.doc.getColor()}
                    setColor={(color: string) => {
                        wournal.doc.setColor(color);
                        forceUpdate();
                    }}/>
            </Toolbar>
        </div>
    );

}
