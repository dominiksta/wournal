import { useEffect, useRef } from 'react';
import { Wournal } from '../document/Wournal';
import './App.css';
import Toolbar from './toolbar/Toolbar';

/** Main React entrypoint */
function App({ wournal }: { wournal: Wournal }) {
    // get a reference to dom element down below for wournal
    const wournalContainer = useRef(null);
    useEffect(() => {
        wournalContainer.current.appendChild(wournal.display);
    }, [])

    return (
        <div className="App">
            <Toolbar wournal={wournal}/>
            <div id="wournal-container" ref={wournalContainer}></div>
        </div>
    );
}

export default App;
