import { useEffect, useRef, useState } from 'react';
import { Wournal } from '../document/Wournal';
import './App.css';
import Toolbar from './toolbar/Toolbar';

/** Main React entrypoint */
function App() {
    // get a reference to dom element down below for wournal
    const wournalContainer = useRef(null);
    let [wournal, setWournal] = useState<Wournal>(null);

    useEffect(() => {
        let w = new Wournal(
            wournalContainer.current as HTMLDivElement, "browser"
        );
        setWournal(w);
        (window as any).wournal = w; // set as window property for debugging
    }, []);

    return (
        <div className="App">
            <Toolbar wournal={wournal}/>
            <div id="wournal-container" ref={wournalContainer}></div>
        </div>
    );
}

export default App;
