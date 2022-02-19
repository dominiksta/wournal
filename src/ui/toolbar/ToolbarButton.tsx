import './ToolbarButton.css'

function ToolbarButton({fun, img, alt, current = false, disabled = false}: {
    fun: () => any, img: string, alt: string, current?: boolean, disabled?: boolean
}) {
    let className = "ToolbarButton" + (current ? " active" : "");
    return (
        <button onClick={fun} className={className} disabled={disabled}>
            <img src={img} alt={alt}/>
        </button>
    );
}

export default ToolbarButton;
