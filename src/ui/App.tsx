import { createContext, useEffect, useRef } from 'react';
import { Wournal } from '../document/Wournal';
import { useForceUpdate } from '../useForceUpdate';
import { ThemeUtils } from '../util/ThemeUtils';
import './App.css';
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
    useEffect(() => {
        wournalContainer.current.appendChild(wournal.display);
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
            <Snackbar>
                <div className="App">
                    <TopBars wournal={wournal} />
                    <div id="wournal-container" ref={wournalContainer}></div>
                </div>
            </Snackbar>
        </ThemeContext.Provider>
    );
}

export default App;
