import React from 'react';

import './App.css'

import GameOfLife, { meta as GameOfLifeMeta } from './projects/GameOfLife/GameOfLife';
import DijkstraGraph, { meta as DijkstraGraphMeta } from './projects/DijkstraGraph/DijkstraGraph';
import InfixToPostfix, { meta as InfixToPostfixMeta } from './projects/InfixToPostfix/InfixToPostfix';

export default function App() {

    let animationTime = 0.5;
    let projects = [
        [GameOfLifeMeta], [DijkstraGraphMeta], [InfixToPostfixMeta]
    ];

    return (
        <>
        <header>
            <div>
                <span className="header-text code1">{"<RainHolloway />"}</span>
            </div>
        </header>
        <div className="content-container">
            <div className="about-me">
                <div className="profile-pic">
                    <img src="https://avatars.githubusercontent.com/u/30580324?v=4"/>
                </div>
                <div className="username profile-margin-top">Rainh2001</div>
                <div className="description profile-margin-top lightgrey">
                    Undergraduate at University of Technology Sydney studying the Bachelor of Computing Science (Honours)
                </div>
                <div className="location profile-margin-top lightgrey smaller-font">
                    Sydney, Australia
                </div>
                <div className="email profile-margin-top lightgrey smaller-font">
                    rainh2001@gmail.com
                </div>
                <div className="github smaller-font">
                    <a target="_blank" href="https://github.com/Rainh2001">github.com/Rainh2001</a>
                </div>
            </div>
            <div className="project-container">
                {/* <div style={{border: '1px solid blue', background: 'red', width: '700px', height: '10rem'}}></div>
                <div style={{border: '1px solid blue', background: 'red', width: '700px', height: '10rem'}}></div>
                <div style={{border: '1px solid blue', background: 'red', width: '700px', height: '10rem'}}></div>
                <div style={{border: '1px solid blue', background: 'red', width: '700px', height: '10rem'}}></div> */}
                {
                    projects.slice().reverse().map(project => {
                        animationTime += 0.1;
                        return <div className="project-transform"><div
                        key={project[0].title}
                        className="project"
                        style={{ animationDelay: `${animationTime}s` }}
                        >
                            <p className="project-title">{ project[0].title }</p>
                            <p className="project-description">{ project[0].description }</p>

                            <a target="_blank" href={project[0].link}>{"<<<"} Check it out {">>>"}</a>
                        </div></div>
                    })
                }
            </div>
        </div>
        </>
    );
}
