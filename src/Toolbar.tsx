import './Toolbar.css';
import ToolbarButton from './ToolbarButton';
import ToolbarGroup from './ToolbarGroup';
import { SVGCanvasTool } from './ui/SVGCanvasTool';
import { SVGCanvasToolEraser } from './ui/SVGCanvasToolEraser';
import { SVGCanvasToolPen } from './ui/SVGCanvasToolPen';
import { SVGCanvasToolRectangle } from './ui/SVGCanvasToolRectangle';
import { SVGCanvasToolSelectRectangle } from './ui/SVGCanvasToolSelectRectangle';
import { SVGCanvasToolText } from './ui/SVGCanvasToolText';
import { Wournal } from './ui/Wournal';

function Toolbar({wournal}: {wournal: Wournal}) {
    // abbreviation
    const setTool = (tool: SVGCanvasTool) => {
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
                    fun={setTool(new SVGCanvasToolPen())} />
                <ToolbarButton
                    img="res/material/selection-drag.svg"
                    fun={setTool(new SVGCanvasToolSelectRectangle())} />
                <ToolbarButton
                    img="res/remix/text.svg"
                    fun={setTool(new SVGCanvasToolText())} />
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={setTool(new SVGCanvasToolEraser(10, false))} />
                <ToolbarButton
                    img="res/remix/eraser-line.svg"
                    fun={setTool(new SVGCanvasToolEraser(10, true))} />
                <ToolbarButton
                    img="res/material/rectangle-outline.svg"
                    fun={setTool(new SVGCanvasToolRectangle())} />
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
