import { CanvasToolName } from "../../document/CanvasTool";
import { ObjWithSetter } from "../util/ObjWithSetter";
import { useStateWithSetter } from "../util/useStateWithSetter";
import "./MouseButtonEditor.css";
import SelectCanvasTool from "./SelectCanvasTool";

export default function MouseButtonEditor({
    rightClick,
}: {
    /** The colors to display. */
    rightClick: ObjWithSetter<CanvasToolName>
}) {
    const [rightClickInternal, commitRightClick] = useStateWithSetter(rightClick);

    return (
        <section className="wournal-settings-section wournal-settings-mouse-buttons">
            <table><tbody>
                <tr>
                    <td> Button 2: </td>
                    <td>
                        <SelectCanvasTool tools={["CanvasToolPen", "CanvasToolEraser",
                            "CanvasToolSelectRectangle", "CanvasToolRectangle"]}
                            value={rightClickInternal}
                            onChange={t => commitRightClick(t as CanvasToolName)} />
                    </td>
                </tr>
            </tbody></table>
        </section >
    );
}
