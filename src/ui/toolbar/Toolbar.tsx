import { useContext } from 'react';
import { ThemeContext } from '../App';
import './Toolbar.css';

export default function Toolbar(
    {children}: {children: JSX.Element[] | JSX.Element}
) {
    const themeCtx = useContext(ThemeContext);
    return (
        <div className="ToolbarWrapper"
            style={{filter: themeCtx.darkTheme ? "invert(1)" : ""}}>
            <div className="Toolbar">
                {children}
            </div>
        </div>
    );
}
