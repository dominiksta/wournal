import './ToolbarButton.css'

function ToolbarButton({
    fun, img, alt, current = false, disabled = false, width = "40px"
}: {
    /** the function to call on button press */
    fun: () => any,
    /** the image to display in the button */
    img: string,
    /** tooltip and accessibility */
    alt: string,
    /** mark/style as currently active */
    current?: boolean,
    /** mark/style as currently not applicable */
    disabled?: boolean,
    /** width of button */
    width?: string
}) {
    let className = "ToolbarButton" + (current ? " active" : "");
    return (
        <button onClick={fun} className={className} disabled={disabled}
            style={{"width": width}} title={alt}>
            <img src={img} alt={alt}/>
        </button>
    );
}

export default ToolbarButton;
