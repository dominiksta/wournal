import { createContext, useContext, useState } from "react";
import "./Menu.css";

export const SubMenuContext = createContext<{
    active: boolean, setActive: (active: boolean) => void
}>(null);

/** A collection of `MenuItem`s. See `Menu` for usage. */
export default function SubMenu({
    text,
    root = false,
    children = []
}: {
    /** How this sub menu is called */
    text: string,
    /** Wether this element is the root submenu */
    root?: boolean,
    /** All children should be either `SubMenu`s or `MenuItem`s */
    children: JSX.Element[] | JSX.Element
}) {
    const [active, setActive] = useState(root);
    const parentContext = useContext(SubMenuContext);

    const setActiveWithParent = (active: boolean) => {
        setActive(active);
        if (parentContext && active) parentContext.setActive(!active);
    }

    const showNest = parentContext ? parentContext.active : false;
    const showBack = parentContext ? active : false;

    return (
        <SubMenuContext.Provider value={{
            active: active, setActive: setActiveWithParent
        }}>
            <div className="MenuItem">
                <button className="MenuNest"
                    hidden={!showNest} onClick={() => {
                        setActive(true);
                        parentContext.setActive(false);
                    }}>
                    <span className="mark"> </span>
                    <span className="text">{text}</span>
                    {/** BLACK RIGHT-POINTING SMALL TRIANGLE */}
                    <span className="right">▸</span>
                </button>
            </div>
            <div className="MenuItem">
                <button className="MenuItem" hidden={!showBack}
                    onClick={() => {
                        setActive(false);
                        parentContext.setActive(true);
                    }}>
                    {/** BLACK LEFT-POINTING SMALL TRIANGLE */}
                    <span className="mark">◂</span>
                    <span className="text">Back</span>
                </button>
            </div>
            <div className="MenuItems"> {children} </div>
        </SubMenuContext.Provider>
    );
}
