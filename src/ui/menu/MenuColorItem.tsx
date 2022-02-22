import MenuItem from "./MenuItem";

export default function MenuColorItems({
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
            <MenuItem
                key={c.color + ":" + c.name}
                mark={"color:" + c.color}
                active={c.color === currentColor}
                fun={() => setColor(c.color)}
                text={c.name}
            />
        );
    }

    return (<> {els} </>);
}
