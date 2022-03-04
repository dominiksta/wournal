import { useState } from "react";
import { CanvasToolName, CanvasToolNames } from "../../document/CanvasTool";
import { CanvasToolConfig } from "../../persistence/ConfigDTO";
import { DSUtils } from "../../util/DSUtils";
import ColorPicker from "../color-picker/ColorPicker";
import { Option, Select } from "../select";
import { ObjWithSetter } from "../util/ObjWithSetter";
import { useStateWithSetter } from "../util/useStateWithSetter";
import SelectCanvasTool from "./SelectCanvasTool";
import "./DefaultToolSettingsEditor.css"

type ConfigurableCanvasTool = "CanvasToolPen" | "CanvasToolEraser" |
                              "CanvasToolText" | "CanvasToolRectangle";

export default function DefaultToolSettingsEditor({
    toolConfig,
}: {
    toolConfig: ObjWithSetter<CanvasToolConfig>,
}) {
    const [toolConfigInternal, commitToolConfig] = useStateWithSetter(toolConfig);
    const [currTool, setCurrTool] = useState<ConfigurableCanvasTool>("CanvasToolPen");

    const toolOpt = (opt: string) => (toolConfigInternal[currTool] as any)[opt];
    const setToolOpt = (opt: string, to: any) => {
        let tmpConfig = DSUtils.copyObj(toolConfigInternal);
        (tmpConfig[currTool] as any)[opt] = to;
        return tmpConfig;
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
                                        commitToolConfig(setToolOpt("strokeWidth", v));
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
                                    commitToolConfig(setToolOpt("color", v))
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
                                        commitToolConfig(
                                            setToolOpt("eraseStrokes", v === "true")
                                        );
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
