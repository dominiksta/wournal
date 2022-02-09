import { CanvasTool } from '../../document/CanvasTool';
import { CanvasToolEraser } from '../../document/CanvasToolEraser';
import { CanvasToolPen } from '../../document/CanvasToolPen';
import { CanvasToolRectangle } from '../../document/CanvasToolRectangle';
import { CanvasToolSelectRectangle } from '../../document/CanvasToolSelectRectangle';
import { CanvasToolText } from '../../document/CanvasToolText';
import { Wournal } from '../../document/Wournal';
import './Toolbar.css';
import ToolbarButton from './ToolbarButton';
import ToolbarGroup from './ToolbarGroup';

function Toolbar({wournal}: {wournal: Wournal}) {
    // abbreviation
    const setTool = (tool: CanvasTool) => {
        return () => {
            wournal.doc.setTool(tool) };
    }

    return (
        <div className="Toolbar">
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/save-3-line.svg"
                    fun={() => wournal.saveDocument()} />
                <ToolbarButton
                    img="res/remix/file-line.svg"
                    fun={() => wournal.loadDocument(true)} />
                <ToolbarButton
                    img="res/remix/folder-open-line.svg"
                    fun={() => wournal.loadDocument()} />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/remix/arrow-go-back-line.svg"
                    fun={() => wournal.doc.undo()} />
                <ToolbarButton
                    img="res/remix/arrow-go-forward-line.svg"
                    fun={() => wournal.doc.redo()} />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/custom/pen.svg"
                    fun={setTool(new CanvasToolPen())} />
                <ToolbarButton
                    img="res/material/selection-drag.svg"
                    fun={setTool(new CanvasToolSelectRectangle())} />
                <ToolbarButton
                    img="res/remix/text.svg"
                    fun={setTool(new CanvasToolText())} />
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={setTool(new CanvasToolEraser(10, false))} />
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={setTool(new CanvasToolEraser(10, true))} />
                <ToolbarButton
                    img="res/material/rectangle-outline.svg"
                    fun={setTool(new CanvasToolRectangle())} />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton
                    img="res/material/magnify-plus-outline.svg"
                    fun={() => wournal.doc.setZoom(wournal.doc.getZoom() + 0.1)} />
                <ToolbarButton
                    img="res/material/magnify-zero-outline.svg"
                    fun={() => wournal.doc.setZoom(1)} />
                <ToolbarButton
                    img="res/material/magnify-minus-outline.svg"
                    fun={() => wournal.doc.setZoom(wournal.doc.getZoom() - 0.1)} />
            </ToolbarGroup>
        </div>
    );
}

export default Toolbar;
