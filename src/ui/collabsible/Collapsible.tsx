import { useState } from "react";
import "./Collapsible.css";

export default function Collapsible({
    title,
    children,
    initialOpen = true,
}: {
    title: string | JSX.Element,
    children: JSX.Element | JSX.Element[],
    initialOpen?: boolean
}) {
    const [open, setOpen] = useState(initialOpen);

    return (
        <div className="wournal-collapsible">
            <div className="wournal-collapsible-title" onClick={() => setOpen(!open)}>
                <h5>{title}</h5>
                <button>
                    {open ? COLLAPSIBLE_CLOSE_SYMBOL : COLLAPSIBLE_OPEN_SYMBOL}
                </button>
            </div>
            <div className="wournal-collapsible-content"
                style={{
                    height: open ? "auto" : "0px",
                    paddingTop: open ? "5px" : "0px",
                    overflow: open ? "auto" : "hidden"
                }}>
                {children}
            </div>
        </div>
    );
}


// chevron-down from google, see https://materialdesignicons.com/
const COLLAPSIBLE_OPEN_SYMBOL =
    <svg style={{width: "20px", height: "20px"}} viewBox="-3 -3 30 30">
        <path fill="currentColor"
            d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
    </svg>;
// chevron-up from google, see https://materialdesignicons.com/
const COLLAPSIBLE_CLOSE_SYMBOL =
    <svg style={{width: "20px", height: "20px"}} viewBox="-3 -3 30 30">
        <path fill="currentColor"
            d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
    </svg>;
