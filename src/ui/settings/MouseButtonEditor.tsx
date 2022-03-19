import { CanvasToolName } from "../../document/CanvasTool";
import { ConfigStoreCtx, ConfigStore_SetRightClick } from "../global-state/ConfigStore";
import useDispatch from "../util/redux/useDispatch";
import useSelector from "../util/redux/useSelector";
import "./MouseButtonEditor.css";
import SelectCanvasTool from "./SelectCanvasTool";

export default function MouseButtonEditor() {
    const binds = useSelector(ConfigStoreCtx, s => s.tmp.binds);
    const dispatch = useDispatch(ConfigStoreCtx);

    return (
        <section className="wournal-settings-section wournal-settings-mouse-buttons">
            <table><tbody>
                <tr>
                    <td> Button 2: </td>
                    <td>
                        <SelectCanvasTool tools={["CanvasToolPen", "CanvasToolEraser",
                            "CanvasToolSelectRectangle", "CanvasToolRectangle"]}
                            value={binds.rightClick}
                            onChange={r =>
                                dispatch(ConfigStore_SetRightClick({r: r as CanvasToolName}))
                            } />
                    </td>
                </tr>
            </tbody></table>
        </section >
    );
}
