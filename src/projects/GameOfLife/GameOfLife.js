import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export let meta = {
    title: "Conway's Game of Life",
    description: "A pure cellular automaton devised by the British mathematician John Horton Conway in 1970. This is one of the many simulations of evolution; interact with the game of life by creating an intial configuration and observe.",
    link: "https://main.d1xd2yhlmkncjb.amplifyapp.com/"
};

class Cell {
    constructor(alive){
        this.live = alive;
        this.level = alive ? 3 : 0;
    }
}

const generate2DArray = (rows, cols, random) => {
    let arr = [];
    for(let i = 0; i < rows; i++){
        arr.push([]);
        for(let j = 0; j < cols; j++){
            if(random){
                arr[i].push(Math.random() > 0.2 ? 0 : 1);
            } else {
                arr[i].push(0);
            }
        }
    }
    return arr;
}

function GameOfLife(props) {

    const [rows, setRows] = useState(() => 30);

    const saveTxt = useRef();
    
    const seconds = useRef(0.1);
    
    // Grid will store the iteration drawn to the screen
    const [grid, setGrid] = useState(() => generate2DArray(rows, rows));
    const [saved, setSaved] = useState(() => {
        let localSaved = JSON.parse(localStorage.getItem("saved"));
        return localSaved ? localSaved : [];
    });

    useEffect(() => {
        if(saved){
            localStorage.setItem("saved", JSON.stringify(saved));
        }
    }, [saved]);

    const [removing, setRemoving] = useState(false);
    const [playing, setPlaying] = useState(() => false);
    const playingRef = useRef(playing);

    useEffect(() => {
        playingRef.current = playing;
    }, [playing]);

    // Size determines the size of each square/cell for spacing purposes
    const size = useMemo(() => 20, []);
    
    const changes = useMemo(() => [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ], []);

    const generate = useCallback(() => {
        if(!playingRef.current) return;

        setGrid((current) => {
            const newGrid = JSON.parse(JSON.stringify(current));

            for(let i = 0; i < current.length; i++){
                for(let j = 0; j < current.length; j++){

                    // Now we have access to current[i][j], now we need to count the neighbours

                    // (rows + i + change) % rows
                    // (rows + j + change) % rows

                    // Calculate neighbours
                    let neighbours = 0;
                    for(let [rowChange, colChange] of changes){
                        let row = (rows + i + rowChange) % rows;
                        let col = (rows + j + colChange) % rows;
                        neighbours += current[row][col];
                    }

                    // Life
                    let cell = current[i][j];

                    if(cell && neighbours < 2){
                        newGrid[i][j] = 0;
                        continue;
                    }
                    if(cell && (neighbours === 3 || neighbours === 2)){
                        newGrid[i][j] = 1;
                        continue;
                    }
                    if(cell && neighbours > 3){
                        newGrid[i][j] = 0;
                        continue;
                    }
                    if(!cell && neighbours === 3){
                        newGrid[i][j] = 1;
                        continue;
                    }

                }
            }

            return newGrid;
        });

        setTimeout(generate, seconds.current * 1000);
    }, [rows, changes]);

    return (
        <div style={{ 
            fontFamily: "Segoe UI, sans-serif", 
            width: `${size * rows}px`, 
            margin: "0 auto" 
        }}>
            <h2>Conway's Game of Life</h2>
            <p>The rules are simple:</p>
            <ol>
                <li>Any live cell with fewer than two live neighbours dies, as if by underpopulation.</li>
                <li>Any live cell with two or three live neighbours lives on to the next generation.</li>
                <li>Any live cell with more than three live neighbours dies, as if by overpopulation.</li>
                <li>Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.</li>
            </ol>
            <p>Start by either clicking the 'Random' button or bringing some cells to life by clicking the boxes. When you're ready to see magic, click 'Start The Game of Life'.</p>
            <p>
                A multitude of varying 2D entities can be produced through the previously stated rules; still lifes, oscillators, spaceships... Check them out here:  
                <a rel="noreferrer" target="_blank" href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life#Examples_of_patterns">Example Patterns</a>
            </p>
            <p>
                If you're interested to learn more, or need some context, read the wikipedia article: 
                <a rel="noreferrer" target="_blank" href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life">Conway's Game of Life</a>
            </p>
            <button onClick={() => {
                setPlaying(current => !current);
                playingRef.current = !playingRef.current;
                if(playingRef){
                    generate();
                }
            }}>
                {`${playing ? "Stop" : "Start"}`} The Game Of Life
            </button>
            <button onClick={() => {
                setGrid(() => generate2DArray(rows, rows, true));
                setPlaying(false);
            }}>
                Random
            </button>
            <button onClick={() => {
                setGrid(() => generate2DArray(rows, rows, false));
                setPlaying(false);
            }}>
                Clear
            </button>
            <div 
            className="game-container"
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${rows}, ${size}px)`,
                margin: 0,
                padding: 0
            }}
            >
                {
                    grid.map((row, i) => 
                        row.map((cell, j) => 
                            <div 
                            key={`(${i}, ${j})`}
                            style={{
                                border: !playing ? "1px solid rgb(51, 51, 51)" : "",
                                width: `${size}px`,
                                height: `${size}px`,
                                background: cell ? "lime" : "black"
                            }}
                            onClick={() => {
                                // if(playing) setPlaying(false);
                                if(playing) return;
                                setGrid(currentGrid => {
                                    let current = JSON.parse(JSON.stringify(currentGrid));
                                    current[i][j] = current[i][j] ? 0 : 1;
                                    return current;
                                })
                            }}
                            ></div>
                        )
                    )
                }
            </div>
            <input ref={saveTxt} type="text" placeholder="Save Name"/>
            <button 
            onClick={() => {
                setSaved(current => {
                    let newSaved = JSON.parse(JSON.stringify(current));
                    newSaved.push({
                        id: saveTxt.current.value + current.length,
                        name: saveTxt.current.value ? saveTxt.current.value : `Save${current.length}`,
                        grid: JSON.parse(JSON.stringify(grid))
                    });
                    saveTxt.current.value = "";
                    return newSaved;
                });
            }}
            >
                Save
            </button>
            <button onClick={() => setRemoving(!removing)}>
                { removing ? "Stop Removing" : "Remove" }
            </button>
            <span style={{ color: "red" }}>
                { removing ? "Warning! You are in REMOVE mode!" : null }
            </span>
            <div style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
            }}>
                { saved.length > 0 && <span style={{marginRight: "0.4rem"}}>Load a save:</span>}
                {
                    saved && saved.map(save => 
                        <button
                        key={save.id}
                        onClick={() => {
                            if(!removing){
                                setPlaying(false);
                                setGrid(save.grid);
                            } else {
                                setSaved(current => {
                                    let arr = [];
                                    for(let saveGrid of current){
                                        if(saveGrid.id !== save.id){
                                            arr.push(saveGrid);
                                        }
                                    }
                                    return arr;
                                });
                            }
                        }}
                        >
                            { save.name }
                        </button>    
                    )
                }
            </div>
        </div>
    );
}

export default GameOfLife;