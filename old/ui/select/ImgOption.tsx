import "./ImgOption.css";

/**
 * Put this component into an <Option> component to display an image alongside
 * the text. For proper spacing set the `imgSpace` prop in the parent <Select>
 * component.
 */
export default function ImgOption({
    children,
    img,
    width = "15px",
    height = "15px",
}: {
    children: string,
    img: string,
    width?: string,
    height?: string,
}) {
    return (
        <span className="select-image-option">
            <img height={height} width={width} src={img} />
            <span>{children}</span>
        </span>
    );
}
