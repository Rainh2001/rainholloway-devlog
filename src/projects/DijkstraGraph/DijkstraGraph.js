import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

import style from './DijkstraGraph.module.css';
import './DijkstraGraph.css';

export let meta = {
    title: "Dijkstra Least-Cost Path",
    description: "Interactive graph (the data structure) creation interface that allows the configuration of a custom interconnected graph. Dijkstra's algorithm is simulated on the constructed graph to reveal the true least-cost path."
};

function useWindowSize() {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}

function useScrollSize(){
    const [scroll, setScroll] = useState({});
    useLayoutEffect(() => {
        function updateScroll(){
            var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
            var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
            setScroll({ left: scrollLeft, top: scrollTop });
        }
        window.addEventListener('scroll', updateScroll);
        updateScroll();
        return () => window.removeEventListener('scroll', updateScroll);
    }, []);
    return scroll;
}

function DijkstraGraph(props) {

    let identifierArr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const availableIdentifiers = useRef(identifierArr);

    const [nodeDimensions, setNodeDimensions] = useState({
        size: 50
    });

    const [graphSize, setGraphSize] = useState(600);
    const windowSize = useWindowSize();
    
    const [graphDOM, setGraphDOM] = useState(null)
    const graphRef = useRef();

    useEffect(() => {
        setGraphDOM(graphRef.current.getBoundingClientRect());
    }, [windowSize]);

    const saveInput = useRef();

    const [saves, setSaves] = useState([]);

    const [removeSave, setRemoveSave] = useState(false);

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const setGraph = (newNodes, newEdges) => {
        setNodes(newNodes);
        setEdges(newEdges);

        availableIdentifiers.current = identifierArr;
        newNodes.forEach(node => {
            availableIdentifiers.current = availableIdentifiers.current.filter(elem => elem !== node.identifier);
        });
    }

    useEffect(() => {
        let dijkstraSaves = JSON.parse(localStorage.getItem("dijkstraSaves")) || [];
        setSaves(dijkstraSaves);
    }, []);

    useEffect(() => {
        localStorage.setItem("dijkstraSaves", JSON.stringify(saves));
    }, [saves]);

    // Generate connected graph from nodes and edges
    const graph = useMemo(() => {

        let graph = {};

        nodes.forEach(node => {
            graph[node.identifier] = new Node(node.identifier, node.x, node.y);
        });

        const getNode = (x, y) => {
            for(let node of nodes){
                if(node.x === x && node.y === y) return graph[node.identifier];
            }
            return null;
        }

        edges.forEach((edge) => {
            let attached = [getNode(edge.startX, edge.startY), getNode(edge.endX, edge.endY)];

            for(let i = 0; i < attached.length; i++){
                let currentNode = attached[i];
                let otherNode = i === 0 ? attached[1] : attached[0];

                currentNode.addNeighbour(otherNode, edge.cost);
            }       
        });
        
        return graph;
    }, [edges, nodes]);

    const [changeEdgeCost, setChangeEdgeCost] = useState(null);
    const [changeText, setChangeText] = useState(null);
    const costInput = useRef();

    useEffect(() => {
        if(changeEdgeCost) costInput.current.focus();
    }, [changeEdgeCost]);

    useEffect(() => {
        if(!changeEdgeCost && changeText){

            let cost = parseInt(changeText.text);
            if(Object.is(cost, NaN) || cost > 100 || cost < 1) return;

            setEdges(current => {
                let newEdges = JSON.parse(JSON.stringify(current));
                newEdges.forEach((edge, i) => {
                    if(isSameEdge(changeText.edge, edge)){
                        newEdges[i].cost = cost;
                        return;
                    }
                });
                return newEdges;
            }); 
        }
    }, [changeEdgeCost, changeText]);

    const [changeIdentifier, setChangingIdentifier] = useState(null);
    const [newIdentifier, setNewIdentifier] = useState(null);
    const identifierInput = useRef();

    useEffect(() => {
        if(!changeIdentifier && newIdentifier){
            let char = newIdentifier.identifier.charAt(0).toUpperCase();
            if(availableIdentifiers.current.indexOf(char) === -1) return;
            
            availableIdentifiers.current.push(newIdentifier.node.identifier);
            const index = availableIdentifiers.current.indexOf(char);
            availableIdentifiers.current.splice(index, 1);
            availableIdentifiers.current.sort();

            setNodes(current => {
                let newNodes = JSON.parse(JSON.stringify(current));
                for(let i = 0; i < newNodes.length; i++){
                    if(isSameNode(newNodes[i], newIdentifier.node)){
                        newNodes[i].identifier = char;
                    }
                }
                return newNodes;
            });

        }
    }, [newIdentifier, changeIdentifier]);

    useEffect(() => {
        if(changeIdentifier) identifierInput.current.focus();
    }, [changeIdentifier]);

    const startNodeSelect = useRef();
    const destNodeSelect = useRef();

    const [leastCostPath, setLeastCostPath] = useState(null);

    const [activeSimulation, setActiveSimulation] = useState(false);
    const [dijkstraInfo, setDijkstraInfo] = useState(null);
    const dijkstraRef = useRef(null);

    const [tool, setTool] = useState("node");
    const [drawEdge, setDrawEdge] = useState([]); // Should change this to a single object, no use having an array

    useEffect(() => {
        if(tool === "edge"){
            setDrawEdge([]);
        }
    }, [tool]);

    let toolStyle = {};

    switch(tool){
        case "node": toolStyle.color = "lime"; break;
        case "edge": toolStyle.color = "blue"; break;
        case "remove": {
            toolStyle = {
                color: "red",
                fontWeight: "bold"
            }
            break;
        }
        default: toolStyle.color = "black"; break;
    }

    return (
        <div
        style={{
            width: graphSize,
            margin: "auto"
        }}
        >
            <div
            style={{
                marginBottom: "1rem"
            }}
            >
                <input ref={saveInput} type="text" placeholder="Save Name"/>
                <button
                onClick={() => { 
                    if(saveInput.current.value !== ""){
                        let saveName = saveInput.current.value;
                        setSaves(current => {
                            let isValid = true;
                            current.forEach(save => {
                                if(save.name === saveName){
                                    isValid = false;
                                }
                            });
                            if(!isValid) return current;

                            return [
                                ...current,
                                { name: saveName, nodes, edges }
                            ];
                        });
                    }
                    saveInput.current.value = "";
                }}
                >Save</button>
                <button
                onClick={() => {
                    setRemoveSave(!removeSave);
                }}
                >Toggle Remove</button>
                <span
                style={{
                    color: "red"
                }}
                >
                    { removeSave ? "Warning! Remove mode is toggled!" : null }
                </span>
                <div>
                    <span>{ saves.length > 0 ? "Saves: " : null }</span>
                    {
                        saves.map(save => 
                            <button
                            key={save.name}
                            onClick={() => {
                                if(removeSave){
                                    setSaves(current => {
                                        let newSaves = JSON.parse(JSON.stringify(current));
                                        newSaves = newSaves.filter(testSave => testSave.name !== save.name);
                                        return newSaves;
                                    });
                                } else {    
                                    setDijkstraInfo(null);
                                    setGraph(save.nodes, save.edges);
                                }   
                            }}
                            >{ save.name }</button>
                        )
                    }
                </div>
            </div>
            
            <span>Select Tool: </span>
            <button onClick={() => setTool("node")}>Node</button>
            <button onClick={() => setTool("edge")}>Edge</button>
            <button onClick={() => setTool("remove")}>Remove</button>
            <span style={{ marginRight: "1rem" }}>Current Tool: <span style={toolStyle}>{`${tool}`}</span></span>

            <div 
            className="graph-container"
            ref={graphRef}
            style={{
                width: graphSize,
                height: graphSize,
                background: "black",
                margin: "auto",
                position: "relative"
            }}
            onClick={(event) => {

                if(event.target.localName !== "input") {
                    if(changeEdgeCost){
                        setChangeEdgeCost(null);
                    }
                } 

                if(changeIdentifier){
                    setChangingIdentifier(null);
                    return null;
                }
                
                if(event.target.localName === "span"){
                    return null;
                }

                // Handle node creation here. Handle edge creation in the onclick of the nodes.
                if(tool === "node"){

                    if(availableIdentifiers.current.length === 0) return;

                    let posX = event.clientX - graphDOM.left;
                    let posY = event.clientY - graphDOM.top;

                    if(posX <= nodeDimensions.size/2 + 2 || posX >= graphSize - nodeDimensions.size/2 + 2 ||
                        posY <= nodeDimensions.size/2 + 2 || posY >= graphSize - nodeDimensions.size/2 + 2) return; 

                
                    for(let node of nodes){
                        let distance = Math.sqrt(Math.pow(posX - node.x, 2) + Math.pow(posY - node.y, 2));
                        if(distance <= nodeDimensions.size*2) return;
                    }

                    let identifier = availableIdentifiers.current[0];

                    setNodes(current => {
                        let newNodes = JSON.parse(JSON.stringify(current));
                        newNodes.push({
                            x: posX,
                            y: posY,
                            identifier
                        });
                        return newNodes;
                    });

                    let newIdentifiers = JSON.parse(JSON.stringify(availableIdentifiers.current));
                    newIdentifiers.shift();
                    availableIdentifiers.current = newIdentifiers;

                    // setIdentifiers(current => {
                    //     let newIdentifiers = JSON.parse(JSON.stringify(current));
                    //     newIdentifiers.shift();
                    //     return newIdentifiers;
                    // });
                } 

            }}
            >
                {/* Draw edges */}
                {
                    edges.map(edge => {

                        const rectWidth = Math.abs(edge.endX - edge.startX);
                        const rectHeight = Math.abs(edge.endY - edge.startY);

                        const edgeWidth = Math.sqrt(rectWidth*rectWidth + rectHeight*rectHeight);

                        let angle = Math.atan(rectWidth/rectHeight);

                        // If in the first quadrant: -Math.PI/2 + angle
                        // If in the second quadrant: 3/2*Math.PI - angle
                        // If in the third quadrant: Math.PI/2 + angle
                        // If in the fourth quadrant: Math.PI/2 - angle

                        if(edge.startX <= edge.endX && edge.startY >= edge.endY){
                            angle = -Math.PI/2 + angle;
                        } else if(edge.startX >= edge.endX && edge.startY >= edge.endY){
                            angle = 3/2*Math.PI - angle;
                        } else if(edge.startX >= edge.endX && edge.startY <= edge.endY){
                            angle = Math.PI/2 + angle;
                        } else if(edge.startX <= edge.endX && edge.startY <= edge.endY){
                            angle = Math.PI/2 - angle;
                        }

                        let activeEdge = false;
                        if(dijkstraInfo?.highlighted){
                            let connectedToCurrent = false;
                            let connectedToNeighbour = false;

                            const isNodeConnected = (edge, node) => {
                                if((edge.startX === node.x && edge.startY === node.y) || 
                                (edge.endX === node.x && edge.endY === node.y)) return true;
                                return false;
                            }

                            nodes.forEach(node => {
                                if(node.identifier === dijkstraInfo.highlighted.current){
                                    connectedToCurrent = isNodeConnected(edge, node);
                                } else if(node.identifier === dijkstraInfo.highlighted.neighbour){
                                    connectedToNeighbour = isNodeConnected(edge, node);
                                }
                            });

                            if(connectedToCurrent && connectedToNeighbour) activeEdge = true;
                        }
                        

                        return <div
                        className={style["edge"]}
                        key={`start:(${edge.startX}, ${edge.startY}) end:(${edge.endX}, ${edge.endY})`}
                        style={{
                            top: edge.startY,
                            left: edge.startX,
                            width: edgeWidth,
                            transform: `rotate(${angle}rad)`,
                            borderTop: `5px solid ${activeEdge ? "yellow" : "blue" }`,
                        }}
                        onClick={() => {
                            if(tool === "remove"){
                                setEdges(current => {
                                    let arr = [];
                                    for(let testEdge of current){
                                        if(!isSameEdge(testEdge, edge)){
                                            arr.push(testEdge);
                                        }
                                    }
                                    return arr;
                                })
                            } 
                        }}
                        >
                        </div>
                    })
                }

                {/* Draw nodes after lines so they have click event priority */}
                {
                    nodes.map(node => {

                        let isChanging = false;
                        if(changeIdentifier){
                            if(node.identifier === changeIdentifier.identifier){
                                isChanging = true;
                            }
                        }

                        let background = "blue";
                        let originalColor = background;
                        if(dijkstraInfo?.highlighted){
                            if(dijkstraInfo.highlighted.current === node.identifier){
                                background = "#0FFFFF"
                            } else if(dijkstraInfo.highlighted.neighbour === node.identifier){
                                background = "yellow"
                            }
                        }
                        
                        return <div 
                        key={`x:${node.x} y:${node.y}`} 
                        className={style["node"]}
                        style={{
                            top: node.y,
                            left: node.x,
                            width: nodeDimensions.size,
                            height: nodeDimensions.size,
                            borderColor: background,
                            borderWidth: background === originalColor ? "1px" : "5px"
                        }}
                        onClick={() => {
                            if(tool === "edge"){
                                if(drawEdge.length === 0){
                                    setDrawEdge(() => {
                                        let arr = [];
                                        arr.push({
                                            x: node.x,
                                            y: node.y
                                        });
                                        return arr;
                                    });
                                } else if(drawEdge.length === 1){
                                    if(drawEdge[0].x === node.x && drawEdge[0].y === node.y) return;

                                    const newEdge = {
                                        startX: drawEdge[0].x,
                                        startY: drawEdge[0].y,
                                        endX: node.x,
                                        endY: node.y,
                                        cost: 1,
                                        midpoint: {
                                            x: (drawEdge[0].x + node.x)/2,
                                            y: (drawEdge[0].y + node.y)/2
                                        }
                                    };

                                    let invalid = false;
                                    for(let edge of edges){
                                        if(newEdge.startX === edge.startX && newEdge.startY === edge.startY &&
                                            newEdge.endX === edge.endX && newEdge.endY === edge.endY) {
                                            invalid = true;
                                        }
                                        if(newEdge.startX === edge.endX && newEdge.startY === edge.endY &&
                                            newEdge.endX === edge.startX && newEdge.endY === edge.startY) {
                                            invalid = true;
                                        }
                                    }
                                    
                                    if(!invalid){
                                        setEdges(current => {
                                            const newEdges = JSON.parse(JSON.stringify(current));
                                            newEdges.push(newEdge);
                                            return newEdges;
                                        });
                                    }
                                    
                                    setDrawEdge(() => []);

                                }
                            } else if(tool === "remove"){

                                let removeEdgeArr = [];
                                edges.forEach(edge => {
                                    if((node.x === edge.startX && node.y === edge.startY) || (node.x === edge.endX && node.y === edge.endY)){
                                        removeEdgeArr.push(edge);
                                    }
                                });

                                if(removeEdgeArr.length > 0){
                                    setEdges(current => {
                                        let arr = [];
                                        current.forEach(edge => {
                                            let isValid = true;
                                            for(let testEdge of removeEdgeArr){
                                                if(isSameEdge(testEdge, edge)){
                                                    isValid = false;
                                                    break;
                                                }
                                            }
                                            if(isValid){
                                                arr.push(edge);
                                            }
                                        });
                                        return arr;
                                    });
                                }

                                let identifier = node.identifier;

                                let newIdentifiers = JSON.parse(JSON.stringify(availableIdentifiers.current));
                                newIdentifiers.push(identifier);
                                newIdentifiers.sort();
                                availableIdentifiers.current = newIdentifiers;

                                // setIdentifiers(current => {
                                //     let newIdentifiers = JSON.parse(JSON.stringify(current));
                                //     newIdentifiers.push(identifier);
                                //     newIdentifiers.sort();
                                //     return newIdentifiers;
                                // });

                                setNodes(current => {
                                    let arr = [];
                                    for(let testNode of current){
                                        if(!isSameNode(testNode, node)){
                                            arr.push(testNode)
                                        }
                                    }
                                    return arr;
                                });

                            }
                        }}
                        >
                            <span
                            className={style["noselect"]}
                            style={{
                                fontWeight: "bold"
                            }}
                            onDoubleClick={() => {
                                setTool("node");
                                setChangingIdentifier(node);
                            }}
                            >
                                { !isChanging && node.identifier }
                            </span>
                        </div>
                    })
                }

                {
                    changeIdentifier &&
                    <input
                    className={style["center"]}
                    style={{
                        color: "black",
                        fontWeight: "bold",
                        border: "none",
                        outline: "none",
                        background: "none",
                        textAlign: "center",
                        position: "absolute",
                        top: `${changeIdentifier.y}px`,
                        left: `${changeIdentifier.x}px`,
                    }} 
                    onChange={(event) => {
                        setNewIdentifier({
                            node: changeIdentifier,
                            identifier: event.target.value
                        });
                    }} 
                    onKeyPress={(event) => {
                        if(event.code === "Enter" || event.key === "Enter"){
                            setChangingIdentifier(null);
                        }
                    }}
                    ref={identifierInput}
                    type="text" />
                }

                {
                    edges.map(edge => {

                        let isChanging = false;
                        if(changeEdgeCost){
                            if(isSameEdge(changeEdgeCost, edge)){
                                isChanging = true;
                            }
                        }

                        return <span
                        key={Math.random()}
                        className={style["center"]}
                        style={{
                            color: "red",
                            position: "absolute",
                            top: `${edge.midpoint.y}px`,
                            left: `${edge.midpoint.x}px`,
                        }}
                        onClick={() => {
                            setTool("edge");
                            setChangeEdgeCost(edge);
                        }}
                        >
                            { !isChanging && edge.cost }
                        </span>
                    })
                }

                {/* Edge Cost Input */}
                {
                    changeEdgeCost && 
                    <input
                    className={style["center"]}
                    style={{
                        color: "red",
                        border: "none",
                        outline: "none",
                        background: "none",
                        textAlign: "center",
                        position: "absolute",
                        top: `${changeEdgeCost.midpoint.y}px`,
                        left: `${changeEdgeCost.midpoint.x}px`,
                    }} 
                    onChange={(event) => {
                        setChangeText({
                            edge: changeEdgeCost,
                            text: event.target.value
                        });
                    }} 
                    onKeyPress={(event) => {
                        if(event.code === "Enter" || event.key === "Enter"){
                            setChangeEdgeCost(null);
                        }
                    }}
                    ref={costInput}
                    type="text" />
                }
            </div>

            <div>
                <span>Choose Start Node:</span>
                <select ref={startNodeSelect} name="start-node" id="start-node">
                {
                    Object.keys(graph).map(key => {
                        return <option key={key} value={key}>{key}</option>
                    })
                }
                </select>
                <span>Choose Destination Node:</span>
                <select ref={destNodeSelect} name="end-node" id="end-node">
                {
                    Object.keys(graph).map(key => {
                        return <option key={key} value={key}>{key}</option>
                    })
                }
                </select>
                <button
                onClick={() => {

                    let startNode = startNodeSelect.current.value;
                    let destNode = destNodeSelect.current.value;

                    if(!(startNode && destNode) || startNode === destNode) return;

                    dijkstraRef.current = new DijkstraTable(graph, startNode, destNode);
                    setDijkstraInfo(dijkstraRef.current.getCurrentDistances());
                    setLeastCostPath(dijkstraRef.current.path);
                    setActiveSimulation(true);
                }}
                >
                    Calculate Least-Cost Path
                </button>
            </div>
            {
                leastCostPath &&
                <div
                style={{
                    marginTop: "1rem",
                    marginBottom: "1rem"
                }}
                >
                    <span
                    style={{
                        marginRight: "1rem"
                    }}
                    >Path: </span>
                    <span
                    style={{
                        marginRight: "1rem",
                        fontWeight: "bold"
                    }}
                    >
                        {
                            leastCostPath.path.split("").map((letter, i, arr)=> {
                                let str = letter;
                                if(i !== arr.length - 1){
                                    str += " > ";
                                }
                                return str;
                            })
                        }
                    </span>
                    <span>Cost: <span style={{fontWeight: "bold"}}>{leastCostPath.cost}</span></span>
                </div>
            }
            {
                activeSimulation &&
                <div
                style={{    
                    marginBottom: "5rem"
                }}
                >
                    <button
                    onClick={() => {
                        setDijkstraInfo(() => dijkstraRef.current.getPreviousDistances());
                    }}
                    >Previous</button>
                    <button
                    onClick={() => {
                        setDijkstraInfo(() => dijkstraRef.current.getNextDistances());
                    }}
                    >Next</button>
                    <button
                    style={{
                        marginLeft: "2rem"
                    }}
                    onClick={() => {
                        setDijkstraInfo(dijkstraRef.current.getEmptyTable());
                    }}
                    >Start Again</button>
                    <button
                    onClick={() => {
                        setDijkstraInfo(dijkstraRef.current.getFullTable());
                    }}
                    >Show Full Table</button>
                    {
                        dijkstraInfo?.table &&
                        <div
                        style={{
                            display: "grid",
                            // gridTemplateColumns: `repeat(${dijkstraInfo.table[0].length}, clamp(30px, ${20 + dijkstraInfo.table[0].length*10}px, 100px))`
                            gridTemplateColumns: `repeat(${dijkstraInfo.table[0].length}, auto)`
                        }}
                        >
                            {
                                dijkstraInfo.table.map((row, i) => {
                                    return row.map((cell, j) => {
                                        return <span
                                        key={`i${i}j${j}`}
                                        style={{
                                            background: i % 2 === 0 ? "lightblue" : "white"
                                        }}
                                        >{ cell === "inf" ? `\u221E` : cell }</span>
                                    });
                                })
                            }
                        </div>
                    }
                </div>
            }
        </div>
    );
}

function isSameEdge(edge1, edge2){
    if(edge1.startX === edge2.startX && edge1.startY === edge2.startY &&
        edge1.endX === edge2.endX && edge1.endY === edge2.endY) {
        return true;
    }
    return false;
}

function isSameNode(node1, node2){
    if(node1.x === node2.x && node1.y === node2.y) return true;
    return false;
}

class DijkstraTable {
    constructor(graph, startNode, endNode){
        this.graph = graph;
        this.startNode = startNode;
        this.endNode = endNode;

        this.currentHistory = 0;

        this.otherNodes = Object.keys(this.graph).filter(key => key !== this.startNode);
        this.header = ["Set", ...this.otherNodes];

        this.history = [];
        
        this.path = this.calculateLeastCostPath();
    }

    getHeader(){
        return this.header;
    }

    getCurrentDistances(){
        return this.history[this.currentHistory];
    }

    getEmptyTable(){
        this.currentHistory = 0;
        return this.getPreviousDistances();
    }

    getFullTable(){
        this.currentHistory = this.history.length-1;
        return this.getNextDistances();
    }

    getNextDistances(){
        if(this.currentHistory !== this.history.length){
            this.currentHistory++;
        }

        if(this.currentHistory === this.history.length) {
            this.currentHistory--;
            let newDistances = JSON.parse(JSON.stringify(this.getCurrentDistances()));
            this.currentHistory++;
            newDistances.highlighted.current = null;
            newDistances.highlighted.neighbour = null;
            return newDistances;
        }

        return this.getCurrentDistances();
    }

    getPreviousDistances(){

        if(this.currentHistory !== -1){
            this.currentHistory--;
        }

        if(this.currentHistory === -1) {
            this.currentHistory++;
            let newDistances = JSON.parse(JSON.stringify(this.getCurrentDistances()));
            this.currentHistory--;
            newDistances.highlighted.current = null;
            newDistances.highlighted.neighbour = null;
            return newDistances;
        }

        return this.getCurrentDistances();
    }

    calculateLeastCostPath(){
        if(this.startNode === this.endNode) return null;

        let current = this.graph[this.startNode];
        
        let completedSet = new Set();
        let distances = { [current.identifier]: { cost: 0, path: "" } };
        let path = current.identifier;
        let costFromCurrent = 0;

        let table = [[...this.header]];

        let indexMap = new Map();
        this.header.forEach((key, i) => {
            if(key !== "Set") {
                indexMap.set(key, i);
            }
        });

        while(completedSet.size !== Object.keys(this.graph).length - 1){

            table.push([]);
            table[table.length-1].push([...completedSet, current.identifier].join(""));
            for(let i = 0; i < this.otherNodes.length; i++){
                table[table.length-1].push("");
            }

            this.history.push({
                table: JSON.parse(JSON.stringify(table)),
                highlighted: {
                    current: current.identifier,
                    neighbour: null,
                }
            });

            for(let i = 0; i < current.neighbours.length; i++){
                let neighbour = current.neighbours[i];
                let costToNeighbour = neighbour.cost + costFromCurrent;
                let neighbourIdentifier = neighbour.node.identifier;

                let index = indexMap.get(neighbourIdentifier);

                const setDistance = () => {
                    distances[neighbourIdentifier] = { cost: costToNeighbour, path: path };
                    table[table.length-1][index] = `${costToNeighbour}${path.charAt(path.length-1)}`
                }

                if(distances[neighbourIdentifier]){
                    if(costToNeighbour < distances[neighbourIdentifier].cost){
                        setDistance();
                    } else {
                        if(!completedSet.has(neighbourIdentifier)){
                            table[table.length-1][index] = table[table.length-2][index];
                        }
                    }
                } else {
                    setDistance();
                }

                this.history.push({
                    table: JSON.parse(JSON.stringify(table)),
                    highlighted: {
                        current: current.identifier,
                        neighbour: neighbourIdentifier,
                    }
                });
            }

            completedSet.add(current.identifier);

            // Integrate this into the neighbours loop, then finito
            for(let i = 1; i < this.header.length; i++){
                let testIdentifier = this.header[i];
                if(table[table.length-1][i] === ""){
                    if(!completedSet.has(testIdentifier)){
                        let distance = distances[testIdentifier];
                        if(distance){
                            table[table.length-1][i] = `${distance.cost}${distance.path.charAt(distance.path.length-1)}`;
                        } else {
                            table[table.length-1][i] = "inf";
                        }
                        this.history.push({
                            table: JSON.parse(JSON.stringify(table)),
                            highlighted: {
                                current: current.identifier,
                                neighbour: null,
                            }
                        });
                    }
                }
            }

            let minCost = Infinity;
            let nextNode = null;
            
            Object.entries(distances).forEach(entry => {
                if(!completedSet.has(entry[0])){
                    if(entry[1].cost < minCost){
                        minCost = entry[1].cost;
                        nextNode = this.graph[entry[0]];
                    } else if(entry[0] === this.endNode && entry[1].cost === minCost){
                        minCost = entry[1].cost;
                        nextNode = this.graph[entry[0]];
                    }
                }
            });

            current = nextNode;

            if(current.identifier === this.endNode){
                distances[this.endNode].path += this.endNode;
                break;
            }

            costFromCurrent = distances[current.identifier].cost;
            path = distances[current.identifier].path + current.identifier;

        }
        return distances[this.endNode];
    }
}

class Node {
    constructor(identifier, x, y){
        this.identifier = identifier;
        this.x = x;
        this.y = y;
        this.neighbours = [];
    }

    addNeighbour(node, edgeCost){
        this.neighbours.push({ node, cost: edgeCost });
    }
}

// function dijkstraLeastCostPath(graph, startNode, endNode){
//     if(startNode === endNode) return null;

//     let current = graph[startNode];
    
//     let completedSet = new Set();
//     let distances = { [current.identifier]: { cost: 0, path: "" } };
//     let path = current.identifier;
//     let costFromCurrent = 0;

//     while(completedSet.size !== Object.keys(graph).length - 1){

//         for(let i = 0; i < current.neighbours.length; i++){
//             let neighbour = current.neighbours[i];
//             let costToNeighbour = neighbour.cost + costFromCurrent;
//             let neighbourIdentifier = neighbour.node.identifier;


//             if(distances[neighbourIdentifier]){
//                 if(costToNeighbour < distances[neighbourIdentifier].cost){
//                     distances[neighbourIdentifier] = { cost: costToNeighbour, path: path };
//                 }
//             } else {
//                 distances[neighbourIdentifier] = { cost: costToNeighbour, path: path };
//             }
//         }
        
//         completedSet.add(current.identifier);

//         let minCost = Infinity;
//         let nextNode = null;
        
//         Object.entries(distances).forEach(entry => {
//             if(!completedSet.has(entry[0])){
//                 if(entry[1].cost < minCost){
//                     minCost = entry[1].cost;
//                     // current = graph[entry[0]];
//                     nextNode = graph[entry[0]];
//                 }
//             }
//         });

//         current = nextNode;

//         if(current.identifier === endNode){
//             distances[endNode].path += endNode;
//             break;
//         }

//         costFromCurrent = distances[current.identifier].cost;
//         path = distances[current.identifier].path + current.identifier;

//     }

//     return distances[endNode];

// }

export default DijkstraGraph;