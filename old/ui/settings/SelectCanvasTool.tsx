import { CanvasToolName } from "../../document/CanvasTool";
import { ImgOption, Option, Select } from "../select";

/** A <Select> component for the given `CanvasTool`s */
export default function SelectCanvasTool({
    value,
    onChange,
    tools,
}: {
    /** The tools to select from */
    tools: Readonly<CanvasToolName[]>,
    /** The value to display */
    value?: string,
    /** Called with the new value when value changes */
    onChange: (value: string) => any,
}) {
    const toolMeta = {
        "CanvasToolPen": {
            icon: "/res/custom/pen.svg", name: "Pen"
        },
        "CanvasToolEraser": {
            icon: "/res/remix/eraser-line.svg", name: "Eraser"
        },
        "CanvasToolText": {
            icon: "/res/remix/text.svg", name: "Text"
        },
        "CanvasToolSelectRectangle": {
            icon: "res/material/selection-drag.svg", name: "Select Rectangle"
        },
        "CanvasToolRectangle": {
            icon: "res/material/rectangle-outline.svg", name: "Rectangle"
        },
    }

    const toolOptions = tools.map(t =>
        <Option value={t} key={t}>
            <ImgOption img={toolMeta[t].icon}>{toolMeta[t].name}</ImgOption>
        </Option>
    );

    return (
        <Select value={value} width="190px" imgSpace={false}
            placeHolder="Select Tool" onChange={onChange}>
            {toolOptions}
        </Select>
    );
}
