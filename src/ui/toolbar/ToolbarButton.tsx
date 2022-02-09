import './ToolbarButton.css'

function ToolbarButton({fun, img, alt}: {fun: () => any, img: string, alt: string}) {
    return (
        <button onClick={fun}>
            <img src={img} alt={alt}/>
        </button>
    );
}

export default ToolbarButton;
