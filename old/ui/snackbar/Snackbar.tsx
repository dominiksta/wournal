import { createContext, useState } from 'react'
import './Snackbar.css';

/**
 * This Snackbar is a (heavily) simpliefied version of
 * https://github.com/evandromacedo/react-simple-snackbar. The only reason
 * reac-simple-snackbar was not used was to cut down on the amount of
 * project dependencies.
 */

/** Default duration in ms */
const defaultDuration = 3000

export const SnackbarContext = createContext<{
    openSnackbar: (text: string | JSX.Element, duration?: number) => void,
    closeSnackbar: () => void,
}>(null)

/**
 * Return a SnackbarContext.Provider Element that must wrap the application to
 * be able to use useSnackbar.
 */
export default function Snackbar({ children }: { children: JSX.Element[] | JSX.Element }) {
    const [open, setOpen] = useState(false)
    const [timeoutId, setTimeoutId] = useState(null)
    const [text, setText] = useState<string | JSX.Element>('')

    const triggerSnackbar = (
        text: string | JSX.Element, duration: number
    ) => {
        setText(text);
        setOpen(true);

        clearTimeout(timeoutId);
        setTimeoutId(setTimeout(() => setOpen(false), duration));
    }

    const openSnackbar = (text: string | JSX.Element,
                          duration: number = defaultDuration) => {
        // Closes the snackbar if it is already open
        if (open === true) {
            setOpen(false);
            triggerSnackbar(text, duration);
        } else {
            triggerSnackbar(text, duration);
        }
    }

    const closeSnackbar = () => { setOpen(false); }

    return (
        /* Provider must wrap the application */
        <SnackbarContext.Provider value={{ openSnackbar, closeSnackbar }}>
            {children}
            <div className="Snackbar" style={{"display": open ? "flex" : "none"}}>
                <div className="SnackbarText">
                    <span>{text}</span>
                </div>
                <button onClick={closeSnackbar}
                    className="SnackbarClose">
                    <CloseIcon/>
                </button>
            </div>
        </SnackbarContext.Provider>
    )
}

// CloseIcon SVG is styled with font properties
const CloseIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 12 12">
        <path
            fill="currentColor"
            d="M11.73 1.58L7.31 6l4.42 4.42-1.06 1.06-4.42-4.42-4.42 4.42-1.06-1.06L5.19 6 .77 1.58 1.83.52l4.42 4.42L10.67.52z"
            fillRule="evenodd"
        />
    </svg>
)
