import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from '../App';
import { ShortcutManager } from '../shortcuts/Shortcuts';
import './ModalManager.css';

export const ModalManagerContext = createContext<{
    openModal: (
        children: string | JSX.Element | JSX.Element[],
        heading: string,
        buttons: {
            name: string, action: () => any,
            close?: boolean,
            style?: "default" | "primary" | "warn" | object
        }[]
    ) => void
}>(null);

let MODAL_COUNTER = 1;
function newModalId(): number { return MODAL_COUNTER++; }

function Modal({
    children,
    heading,
    close,
    num,
    buttons,
}: {
    children: JSX.Element | JSX.Element[],
    heading: string,
    close: () => any,
    num: number,
    buttons?: { name: string, action: () => any, close?: boolean,
                style?: "default" | "primary" | "warn" | object }[],
}) {
    const mainEl = useRef<HTMLDivElement>(null);
    useEffect(() => {
        /* ShortcutManager.unFocus(); */
        mainEl.current.focus();
    }, []);

    let btns = [];
    for (let button of buttons) {
        let className = "wournal-modal-button";
        let style = {}
        if (button.style) {
            if (button.style === "warn")
                className += " wournal-btn wournal-btn-warn";
            else if (button.style === "primary")
                className += " wournal-btn wournal-btn-primary";
            else if (button.style === "default")
                className += " wournal-btn";
            else {
                className += " wournal-btn";
                style = button.style;
            }
        } else {
            className += " wournal-btn";
        }
        btns.push(
            <button className={className} style={style}
                key={button.name} onClick={() => {
                    button.action();
                    if (button.close) close();
                }}>{button.name}</button>
        );
    }

    if (!buttons) {
        let closeBtn =
            <button className="wournal-modal-button wournal-btn wournal-btn-primary"
                key="Close" onClick={close}>Close</button>;
        btns.push(closeBtn);
    }

    const themeCtx = useContext(ThemeContext);

    return (
        <div tabIndex={1} ref={mainEl} className="wournal-modal-overlay">
            <div className="wournal-modal-wrapper"
                style={{ filter: themeCtx.darkTheme ? "invert(1)" : "" }}>
                <div className="wournal-modal" key={num}>
                    <h3 className="wournal-modal-heading">{heading}</h3>
                    <section className="wournal-modal-content">{children}</section>
                    <section className="wournal-modal-buttons">{btns}</section>
                </div>
            </div>
        </div>
    );
}

export default function ModalManager(
    { children }: { children: JSX.Element[] | JSX.Element }
) {
    const [modals, setModals] = useState<JSX.Element[]>([]);
    const closeModal = (num: number) => () => {
        setModals(modals.filter(m => m.props.num !== num))
        ShortcutManager.focus();
    };

    const openModal = (
        content: string | JSX.Element | JSX.Element[],
        heading: string,
        buttons: { name: string, action: () => any, close?: boolean,
                   style?: "default" | "primary" | "warn" | object }[] = []
    ) => {
        if (typeof content === "string") {
            content = <span>{content}</span>;
        }
        const num = newModalId();
        let modal = <Modal heading={heading} buttons={buttons}
            close={closeModal(num)} num={num} key={num}>{content}</Modal>;
        setModals(modals.concat([modal]));
    }

    return (
        <ModalManagerContext.Provider value={{ openModal: openModal }}>
            {children}
            {modals}
        </ModalManagerContext.Provider>
    );
}
