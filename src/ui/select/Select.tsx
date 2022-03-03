import { createContext, useRef, useState } from "react";
import useOnClickOutside from "../util/useOnClickOutside";
import { TextOption } from "./Option";
import "./Select.css";

export const SelectContext = createContext<{
    value: string;
    width: string,
    imgSpace: boolean,
    changeSelectedOption: (value: string) => void;
}>(null);

/**
 * A select element similar in use to a regular HTML <select> element. The
 * difference is that one can use any arbitrary content in the corresponding
 * <Option> elements. For example, it is possible to put an <ImgOption> into
 * such an <Option> to display an image before the text.
 *
 * The code is (somewhat heavily) adapted from
 * https://codesandbox.io/s/heuristic-nightingale-mhurf
 */
export default function Select({
    children,
    placeHolder = "",
    value = "",
    onChange = () => null,
    width = "100px",
    imgSpace = true,
}: {
    /** Multiple <Option> elements */
    children: JSX.Element[],
    /** A placeholder to display when no element is selected */
    placeHolder?: string,
    /** The value to display */
    value?: string,
    /** Called with the new value when value changes */
    onChange: (value: string) => any,
    /** The width of the <Select> component and all ist <Option>s */
    width?: string,
    /** Wether to leave some additional space for images in <ImgOption>s */
    imgSpace?: boolean,
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropDownPos, setDropDownPos] = useState({x: 0, y: 0});
    const selectContainerRef = useRef(null);

    useOnClickOutside(selectContainerRef, () => setShowDropdown(false));

    let selectText = "";
    if (value.length > 0) selectText =
        children.find(c => c.props.value === value).props.children;
    else if (placeHolder.length > 0) selectText = placeHolder;
    else selectText = "Choose an option";

    const moveDropdown = () => {
        const r = (selectContainerRef.current as HTMLDivElement).
            getBoundingClientRect();
        setDropDownPos({y: r.bottom, x: r.left});
    }

    return (
        <SelectContext.Provider
            value={{
                value, width, imgSpace, changeSelectedOption: (option) => {
                    setShowDropdown(false);
                    onChange(option);
                }
            }}>
            <div className="select-container" ref={selectContainerRef}
                style={{width: width}}>
                <div className={"selected-text" + (showDropdown ? " active" : "")}
                    onClick={() => {
                        moveDropdown();
                        setShowDropdown(!showDropdown);
                    }}>
                    {
                        typeof selectText === "string" ?
                            <TextOption>{selectText}</TextOption> : selectText
                    }
                    <img className="select-right-icon"
                        src={showDropdown ? "res/material/chevron-up.svg" :
                            "res/material/chevron-down.svg"} />
                </div>
                <ul className="select-options" hidden={!showDropdown}
                    style={{ top: dropDownPos.y, left: dropDownPos.x }}>
                    {children}
                </ul>
            </div>
        </SelectContext.Provider>
    );
}
