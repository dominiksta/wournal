import { useContext } from "react"
import { SnackbarContext } from "./Snackbar"

export const useSnackbar = () => {
    const { openSnackbar, closeSnackbar } = useContext(SnackbarContext)
    return [openSnackbar, closeSnackbar];
}
