import { useState } from "react";
import ColorPicker from "../color-picker/ColorPicker";
import { ConfigStoreCtx, ConfigStore_SetCanvasToolConfig } from "../global-state/ConfigStore";
import { Option, Select } from "../select";
import useDispatch from "../util/redux/useDispatch";
import useSelector from "../util/redux/useSelector";
import "./DefaultToolSettingsEditor.css";
import SelectCanvasTool from "./SelectCanvasTool";

type ConfigurableCanvasTool = "CanvasToolPen" | "CanvasToolEraser" |
                              "CanvasToolText" | "CanvasToolRectangle";

export default function DefaultToolSettingsEditor() {
    const toolConfig = useSelector(ConfigStoreCtx, s => s.tmp.tools);
    const dispatch = useDispatch(ConfigStoreCtx);

    const [currTool, setCurrTool] = useState<ConfigurableCanvasTool>("CanvasToolPen");

    const toolOpt = (opt: string) => (toolConfig[currTool] as any)[opt];
    const setToolOpt = (opt: string, to: any) => {
        (toolConfig[currTool] as any)[opt] = to;
        return toolConfig;
    }

    return (
        <section className="wournal-settings-section
            wournal-settings-tool-defaults">
            <SelectCanvasTool tools={[
                "CanvasToolPen", "CanvasToolEraser",
                "CanvasToolText", "CanvasToolRectangle"]} value={currTool}
                onChange={t => setCurrTool(t as ConfigurableCanvasTool)} />
            <table><tbody>
                {
                    toolOpt("strokeWidth") === undefined ? null :
                        <tr>
                            <td> Thickness: </td>
                            <td>
                                <Select value={toolOpt("strokeWidth")} imgSpace={false}
                                    onChange={(v) => {
                                        dispatch(ConfigStore_SetCanvasToolConfig(
                                            setToolOpt("strokeWidth", v)))
                                    }}>
                                    <Option value="fine">Fine</Option>
                                    <Option value="medium">Medium</Option>
                                    <Option value="thick">Thick</Option>
                                </Select>
                            </td>
                        </tr>
                }
                {
                    toolOpt("color") === undefined ? null :
                        <tr>
                            <td> Color: </td>
                            <td>
                                <ColorPicker color={toolOpt("color")} onChange={(v) =>
                                    dispatch(ConfigStore_SetCanvasToolConfig(
                                        setToolOpt("color", v)))
                                } />
                            </td>
                        </tr>
                }
                {
                    toolOpt("eraseStrokes") === undefined ? null :
                        <tr>
                            <td> Eraser Type: </td>
                            <td>
                                <Select value={toolOpt("eraseStrokes").toString()}
                                    width="150px"
                                    imgSpace={false} onChange={(v) => {
                                        dispatch(ConfigStore_SetCanvasToolConfig(
                                            setToolOpt("eraseStrokes", v === "true")))
                                    }}>
                                    <Option value="true">Erase Strokes</Option>
                                    <Option value="false">Erase Points</Option>
                                </Select>
                            </td>
                        </tr>
                }
            </tbody></table>
        </section>
    );
}
