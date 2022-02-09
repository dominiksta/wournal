import { useEffect, useRef, useState } from 'react';
import './App.css';
import { DocumentRepositoryBrowserFiles } from './persistence/DocumentRepositoryBrowserFiles';
import Toolbar from './Toolbar';
import { Wournal } from './ui/Wournal';

/** Main React entrypoint */
function App() {
    let repoImpl = DocumentRepositoryBrowserFiles.getInstance();
    // let repoImpl = DocumentRepositoryTestFiles.getInstance();

    // get a reference to dom element down below for wournal
    const wournalContainer = useRef(null);
    let [wournal, setWournal] = useState<Wournal>(null);

    useEffect(() => {
        let w = new Wournal(
            wournalContainer.current as HTMLDivElement, repoImpl
        );
        setWournal(w);
        (window as any).wournal = w; // set as window property for debugging
    }, []);

    return (
        <div className="App">
            <Toolbar wournal={wournal}/>
            <div ref={wournalContainer}></div>
        </div>
    );
}

export default App;
