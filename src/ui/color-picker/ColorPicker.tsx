import { ChangeEvent } from "react";
import "./ColorPicker.css";

/**
 * A simple color picker using a text input field for hex colors and the
 * browsers built in `<input type="color"/>`. The implementation of an `<input
 * type="color"/>` will vary by browser and platform. A more portable aproach
 * would be to use a javascript color picker library, but this should suffice
 * for now - especially because the main target platform is chrome, which has an
 * excellent built in color picker.
 */
export default function ColorPicker({
    color,
    onChange,
}: {
    color: string,
    onChange: (color: string) => any,
}) {
    const onChangeInternal = (e: ChangeEvent<HTMLInputElement>) => {
        const newCol = e.target.value;
        if (!newCol.match("^#[A-Fa-f0-9]*$")) return;
        onChange(e.target.value);
    };

    const colorRegexp = /^#[A-Fa-f0-9]{6}$/;

    return (
        <div className="wournal-color-picker">
            <span className="wournal-color-picker-color" style={{background: color}}>
                <input onChange={onChangeInternal} value={
                    color.match(colorRegexp) ? color : "#000000"
                } type="color" />
            </span>
            <input onChange={onChangeInternal}
                value={color} type="text"
                className={
                    "wournal-color-picker-text" + (color.match(colorRegexp) ?
                        "" : " wournal-input-invalid")
                }/>
        </div>
    );
}
