import { CSSProperties, useContext } from "react";
import { SelectContext } from "./Select";
import "./Option.css";

/**
 * Should not be used on its own. Will be inserted automatically into an
 * <Option> if only a string is given.
 */
export function TextOption({
    children,
}: {
    children: string
}) {
    const selectCtx = useContext(SelectContext);

    return (
        <span className="select-text-option"
            style={{ paddingLeft: selectCtx.imgSpace ? "24px" : "10px" }}>
            {children}
        </span>
    );
}

/** See <Select> Component */
export default function Option({
    children,
    value,
    style = {}
}: {
    children: string | JSX.Element,
    value: string,
    style?: CSSProperties,
}) {
    const selectCtx = useContext(SelectContext);

    return (
        <li className="select-option"
            style={{...style, width: selectCtx.width}}
            onClick={() => selectCtx.changeSelectedOption(value)}>
            {
                typeof children === "string" ?
                    <TextOption>{children}</TextOption> : children
            }
        </li>
    );
}
