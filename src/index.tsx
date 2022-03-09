import React from 'react';
import ReactDOM from 'react-dom';
import { Wournal } from './document/Wournal';
import './index.css';
import App from './ui/App';
import StoresProvider from './ui/global-state/StoresProvider';

export const APP_ROOT_ELEMENT = document.getElementById("root");

let w = new Wournal(document.createElement("div"), "browser");

(window as any).wournal = w; // set as window property for debugging
w.init().then(() => {

    // React bootstrap
    ReactDOM.render(
        <React.StrictMode>
            <StoresProvider>
                <App wournal={w} />
            </StoresProvider>
        </React.StrictMode>,
        APP_ROOT_ELEMENT
    );
});
