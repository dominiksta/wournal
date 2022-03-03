import { CanvasToolName } from "../../document/CanvasTool";
import { ImgOption, Option, Select } from "../select";
import { ObjWithSetter } from "../util/ObjWithSetter";
import { useStateWithSetter } from "../util/useStateWithSetter";
import "./MouseButtonEditor.css";

export default function MouseButtonEditor({
    rightClick,
}: {
    /** The colors to display. */
    rightClick: ObjWithSetter<CanvasToolName>
}) {
    const [rightClickInternal, commitRightClick] = useStateWithSetter(rightClick);

    return (
        <section className="wournal-settings-section wournal-settings-mouse-buttons">
            <table>
                <tbody>
                    <tr>
                        <td> Button 2: </td>
                        <td>
                            <Select value={rightClickInternal} width="190px" imgSpace={false}
                                onChange={(t) => {
                                    commitRightClick(t as CanvasToolName);
                                }}>
                                <Option value="CanvasToolPen">
                                    <ImgOption img="/res/custom/pen.svg">Pen</ImgOption>
                                </Option>
                                <Option value="CanvasToolEraser">
                                    <ImgOption img="/res/remix/eraser-line.svg">Eraser</ImgOption>
                                </Option>
                                <Option value="CanvasToolSelectRectangle">
                                    <ImgOption img="res/material/selection-drag.svg">
                                        Select Rectangle
                                    </ImgOption>
                                </Option>
                                <Option value="CanvasToolRectangle">
                                    <ImgOption img="res/material/rectangle-outline.svg">
                                        Rectangle
                                    </ImgOption>
                                </Option>
                            </Select>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section >
    );
}
