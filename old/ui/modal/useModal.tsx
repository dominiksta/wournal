import { useContext } from "react";
import { ModalManagerContext } from "./ModalManager";

export default function useModal() {
    return useContext(ModalManagerContext).openModal;
}
