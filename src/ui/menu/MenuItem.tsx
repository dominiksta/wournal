import { useContext } from "react";
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
}) {
    let markItem;
    switch(mark) {
        case "check":
            markItem = <span className="mark">✓</span>; // CHECK MARK
            break;
        case "dot":
            markItem = <span className="mark">•</span>; // DOT
            break;
        case "":
            markItem = <span className="mark"></span>;
            break;
        default:
            markItem = <img className="mark" src={mark} alt={text}/>;
            break;
    }

    let rightItem;
    switch(right) {
        default:
            rightItem = <span className="right">{right}</span>;
            break;
    }

    const subMenuCtx = useContext(SubMenuContext);

    return (
        <div className={"MenuItem" + (active ? " active" : "")}
            hidden={!subMenuCtx.active}>
            <button onClick={() => fun()} disabled={disabled}>
                {markItem}
                <span className="text">{text}</span>
                {rightItem}
            </button>
        </div>
    )
}
