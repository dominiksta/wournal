import { DSUtils } from "../../util/DSUtils";
import { ObjWithSetter } from "../util/ObjWithSetter";
import { useStateWithSetter } from "../util/useStateWithSetter";
import "./ColorPaletteEditor.css";

export default function ColorPaletteEditor({
    colors,
}: {
    /** The colors to display. */
    colors: ObjWithSetter<{color: string, name: string}[]>
}) {
    const [colorsInternal, commitColors] = useStateWithSetter(colors);

    let colorEls = [];
    let colorI = 0;
    for (let c of colorsInternal) {

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
                            let tmpColors = DSUtils.copyObj(
                                colorsInternal.filter(col => !colCompare(col)));
                            commitColors(tmpColors);
                        }}
                        className="wournal-color-remove">
                        × {/* MULTIPLICATION SIGN */}
                    </button>
                </td>
                <td>
                    <input
                        onChange={(e) => {
                            let tmpColors = DSUtils.copyObj(colorsInternal);
                            tmpColors.find(colCompare).name = e.target.value;
                            commitColors(tmpColors);
                        }}
                        value={c.name} />
                </td>
                <td className="wournal-color-display"
                    style={{ background: c.color }}> </td>
                <td>
                    <input
                        className="wournal-color-input"
                        onChange={(e) => {
                            let tmpColors = DSUtils.copyObj(colorsInternal);
                            tmpColors.find(colCompare).color = e.target.value;
                            commitColors(tmpColors);
                        }}
                        value={c.color} />
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
                        <td> </td>
                        <td className="wournal-settings-color-add">
                            <button onClick={() => {
                                let tmpColors = DSUtils.copyObj(colorsInternal);
                                tmpColors.push({color: "#FFFFFF",
                                                name: `Color ${colorsInternal.length}`});
                                commitColors(tmpColors);
                            }}>+</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    );

}
