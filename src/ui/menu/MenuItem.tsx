import { useContext } from "react";
import { Shortcut, ShortcutManager } from "../shortcuts/Shortcuts";
import "./Menu.css";
import { SubMenuContext } from "./SubMenu";

/** An individual (clickable) item in the menu. */
export default function MenuItem({
    fun,
    text,
    mark = "",
    right = "",
    disabled = false,
    active = false,
    shortcut = "",
}: {
    /** Call this function on click */
    fun: () => any,
    /** Main text describing this item */
    text: string,
    /** A mark left to the `text`. If not == "check" or "dot", the string is
    interpreted as a path to an image */
    mark?: "check" | "dot" | string,
    /** Text floating right of the `text` */
    right?: string,
    /** Wether to disabled the button */
    disabled?: boolean,
    /** Wether the function of this button is currently active */
    active?: boolean,
    /** set a shortcut for `fun` */
    shortcut?: string,
}) {
    if (shortcut !== "") {
        ShortcutManager.addShortcut(Shortcut.fromId(shortcut, fun))
        right = shortcut;
    }

    let markItem;
    if (mark === "check") {
        markItem = <span className="mark">✓</span>; // CHECK MARK
    } else if (mark === "dot") {
        markItem = <span className="mark">•</span>; // DOT
    } else if (mark === "") {
        markItem = <span className="mark"></span>;
    } else if (mark.startsWith("color:")) {
        const color = mark.split("color:")[1];
        markItem = <span className="mark colorMark"
                       style={{"background": color}}></span>;
    } else {
        markItem = <img className="mark" src={mark} alt={text} />;
    }

    const subMenuCtx = useContext(SubMenuContext);

    return (
        <div className={"MenuItem" + (active ? " active" : "")}
            hidden={!subMenuCtx.active}>
            <button onClick={() => fun()} disabled={disabled}>
                {markItem}
                <span className="text">{text}</span>
                <span className={"right" + (shortcut !== "" ? " shortcut" : "")}>
                    {right}
                </span>
            </button>
        </div>
    )
}
