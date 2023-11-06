import { CanvasToolTextConfig } from "../../persistence/ConfigDTO";
import { DSUtils } from "../../util/DSUtils";
import { Option, Select } from "../select";
import "./FontPicker.css";

export default function FontPicker({
    config,
    onChange,
}: {
    config: CanvasToolTextConfig,
    onChange: (c: CanvasToolTextConfig) => any,
}) {
    const bundledFonts = ["Roboto", "Roboto Mono"];
    /* console.log(config); */

    const optionsFamily = bundledFonts.map(f =>
        <Option value={f} key={f} style={{ fontFamily: f }}>{f}</Option>
    );

    return (
        <div className="wournal-font-picker">
            <Select style={{ fontFamily: config.fontFamily }} imgSpace={false}
                width={"300px"}
                value={config.fontFamily} onChange={f => {
                    config.fontFamily = f;
                    onChange(config);
                }}>
                {optionsFamily}
            </Select>
            <table><tbody>
                <tr>
                    <td> Size: </td>
                    <td>
                        <input type="number" value={config.fontSize} onChange={e => {
                            config.fontSize = parseInt(e.target.value);
                            onChange(config);
                        }} />
                    </td>
                </tr>
                <tr>
                    <td> Weight: </td>
                    <td>
                        <Select width={"100px"} imgSpace={false}
                            value={config.fontWeight} onChange={w => {
                                config.fontWeight = w as "normal" | "bold";
                                onChange(config);
                            }}>
                            <Option value={"normal"}>Normal</Option>
                            <Option value={"bold"}>Bold</Option>
                        </Select>
                    </td>
                </tr>
                <tr>
                    <td> Style: </td>
                    <td>
                        <Select width={"100px"} imgSpace={false}
                            value={config.fontStyle} onChange={w => {
                                config.fontStyle = w as "normal" | "italic";
                                onChange(config);
                            }}>
                            <Option value={"normal"}>Normal</Option>
                            <Option value={"italic"}>Italic</Option>
                        </Select>
                    </td>
                </tr>
            </tbody></table>
        </div>
    );
}
