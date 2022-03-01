import { createContext, useEffect, useRef } from 'react';
import { Wournal } from '../document/Wournal';
import { useForceUpdate } from './util/useForceUpdate';
import { ThemeUtils } from '../util/ThemeUtils';
import './App.css';
import ModalManager from './modal/ModalManager';
import { ShortcutManager } from './shortcuts/Shortcuts';
import Snackbar from './snackbar/Snackbar';
import TopBars from './top-bars/TopBars';

export const ThemeContext = createContext<{
    darkTheme: boolean,
    setTheme: (theme: "light" | "dark" | "auto") => void,
}>(null);

/** Main React entrypoint */
function App({ wournal }: { wournal: Wournal }) {
    // get a reference to dom element down below for wournal
    const wournalContainer = useRef(null);
    const appContainer = useRef(null);
    useEffect(() => {
        wournalContainer.current.appendChild(wournal.display);
        ShortcutManager.setup(appContainer.current);
    }, [wournal.display])

    const forceUpdate = useForceUpdate();

    wournal.doc.updateTheme();
    ThemeUtils.registerThemeChangeHandler(() => {
        wournal.doc.updateTheme();
        forceUpdate();
    });

    return (
        <ThemeContext.Provider value={{
            darkTheme: ThemeUtils.currDark(),
            setTheme: (theme: "light" | "dark" | "auto") => {
                Wournal.CONF.theme = theme;
                wournal.doc.updateTheme();
                forceUpdate();
            }
        }}>
            <div ref={appContainer} className="wournal-app">
                <Snackbar>
                    <ModalManager>
                        <TopBars wournal={wournal} />
                        <div className="wournal-container" ref={wournalContainer}></div>
                    </ModalManager>
                </Snackbar>
            </div>
        </ThemeContext.Provider>
    );
}

export default App;
