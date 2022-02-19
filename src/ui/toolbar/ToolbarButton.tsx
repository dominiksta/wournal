import './ToolbarButton.css'

function ToolbarButton({fun, img, alt, current = false}: {
    fun: () => any, img: string, alt: string, current?: boolean
}) {
    return (
        <button onClick={fun} className={current ? "active" : ""}>
            <img src={img} alt={alt}/>
        </button>
    );
}

export default ToolbarButton;
