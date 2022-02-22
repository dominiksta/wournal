import { useEffect, useRef } from 'react';
import { Wournal } from '../document/Wournal';
import './App.css';
import Snackbar from './snackbar/Snackbar';
import TopBars from './top-bars/TopBars';

/** Main React entrypoint */
function App({ wournal }: { wournal: Wournal }) {
    // get a reference to dom element down below for wournal
    const wournalContainer = useRef(null);
    useEffect(() => {
        wournalContainer.current.appendChild(wournal.display);
    }, [wournal.display])

    return (
        <Snackbar>
            <div className="App">
                <TopBars wournal={wournal} />
                <div id="wournal-container" ref={wournalContainer}></div>
            </div>
        </Snackbar>
    );
}

export default App;
