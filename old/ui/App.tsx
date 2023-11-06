import { createContext, useEffect, useRef } from 'react';
import { Wournal } from '../document/Wournal';
import { ThemeUtils } from '../util/ThemeUtils';
import './App.css';
import { ConfigStoreCtx, ConfigStore_Set } from './global-state/ConfigStore';
import ModalManager from './modal/ModalManager';
import { ShortcutManager } from './shortcuts/Shortcuts';
import Snackbar from './snackbar/Snackbar';
import TopBars from './top-bars/TopBars';
import useDispatch from './util/redux/useDispatch';
import { useForceUpdate } from './util/useForceUpdate';

export const ThemeContext = createContext<{
    darkTheme: boolean,
    setTheme: (theme: "light" | "dark" | "auto") => void,
}>(null);

/** Main React entrypoint */
function App({ wournal }: { wournal: Wournal }) {
    const dispatch = useDispatch(ConfigStoreCtx);

    // get a reference to dom element down below for wournal
    const wournalContainer = useRef(null);
    const appContainer = useRef(null);

    useEffect(() => {
        wournalContainer.current.appendChild(wournal.display);
        ShortcutManager.setup(appContainer.current);
        dispatch(ConfigStore_Set(Wournal.CONF));
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
                        <div className="wournal-container"
                            ref={wournalContainer}></div>
                    </ModalManager>
                </Snackbar>
            </div>
        </ThemeContext.Provider>
    );
}

export default App;
