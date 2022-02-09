import './ToolbarGroup.css'

export function ToolbarGroup({children}: {children: JSX.Element[] | JSX.Element}) {
    return (
        <div className="ToolbarGroup">
            {children}
        </div>
    );
}

export default ToolbarGroup;
