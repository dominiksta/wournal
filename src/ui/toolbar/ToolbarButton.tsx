import './ToolbarButton.css'

function ToolbarButton({fun, img, alt, current = false}: {
    fun: () => any, img: string, alt: string, current?: boolean
}) {
    let className = "ToolbarButton" + (current ? " active" : "");
    return (
        <button onClick={fun} className={className}>
            <img src={img} alt={alt}/>
        </button>
    );
}

export default ToolbarButton;
