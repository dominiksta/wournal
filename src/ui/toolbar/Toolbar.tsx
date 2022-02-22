import './Toolbar.css';

export default function Toolbar(
    {children}: {children: JSX.Element[] | JSX.Element}
) {
    return (
        <div className="ToolbarWrapper">
            <div className="Toolbar">
                {children}
            </div>
        </div>
    );
}
