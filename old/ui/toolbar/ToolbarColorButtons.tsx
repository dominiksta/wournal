import ToolbarButton from "./ToolbarButton";

export default function ToolbarColorButtons({
    colors, currentColor, setColor,
}: {
    colors: {color: string, name: string}[],
    currentColor: string,
    setColor: (color: string) => void,
}
) {

    let els: JSX.Element[] = [];
    for (let c of colors) {
        els.push(
            <ToolbarButton
                key={c.color + ":" + c.name}
                width="28px"
                img={"color:" + c.color}
                current={c.color === currentColor}
                fun={() => setColor(c.color)}
                alt={c.name}
            />
        );
    }

    return (<> {els} </>);
}
