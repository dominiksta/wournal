import { DSUtils } from "../../util/DSUtils";
import ColorPicker from "../color-picker/ColorPicker";
import { ConfigStoreCtx, ConfigStore_SetColorConfig } from "../global-state/ConfigStore";
import useDispatch from "../util/redux/useDispatch";
import useSelector from "../util/redux/useSelector";
import "./ColorPaletteEditor.css";

export default function ColorPaletteEditor() {
    const colors = useSelector(ConfigStoreCtx, s => s.tmp.colorPalette);
    const dispatch = useDispatch(ConfigStoreCtx);

    let colorEls = [];
    let colorI = 0;
    for (let c of colors) {

        /* Note: Implementing the comparison this way means that no two colors
        can have the same name and value, otherwise this component will get
        really confused. Since that is not likely to happen with the way the
        component is designed and since it would not be useful feature anyway,
        this bug should not be an issue in practice.  */
        const colCompare = (col: {name: string, color: string}) => {
            return col.name === c.name && col.color === c.color;
        }

        colorEls.push(
            <tr key={colorI}>
                <td>
                    <button
                        onClick={() => {
                            dispatch(ConfigStore_SetColorConfig(
                                colors.filter(col => !colCompare(col))));
                        }}
                        className="wournal-color-remove">
                        × {/* MULTIPLICATION SIGN */}
                    </button>
                </td>
                <td>
                    <input
                        onChange={(e) => {
                            colors.find(colCompare).name = e.target.value;
                            dispatch(ConfigStore_SetColorConfig(colors));
                        }}
                        value={c.name} />
                </td>
                <td>
                    <ColorPicker color={c.color}
                        onChange={(color: string) => {
                            let tmpColors = DSUtils.copyObj(colors);
                            tmpColors.find(colCompare).color = color;
                            dispatch(ConfigStore_SetColorConfig(tmpColors));
                        }} />
                </td>
            </tr>
        );
        colorI++;
    }

    return (
        <section className="wournal-settings-section wournal-settings-color">
            <table>
                <tbody>
                    {colorEls}
                    <tr>
                        <td> </td>
                        <td> </td>
                        <td className="wournal-settings-color-add">
                            <button onClick={() => {
                                let tmpColors = DSUtils.copyObj(colors);
                                tmpColors.push({color: "#FFFFFF",
                                                name: `Color ${colors.length}`});
                                dispatch(ConfigStore_SetColorConfig(tmpColors));
                            }}>+</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    );
}
