import './ToolbarButton.css'

function ToolbarButton({fun, img}: {fun: () => any, img: string}) {
    return (
        <button onClick={fun}>
            <img src={img}/>
        </button>
    );
}

export default ToolbarButton;
