import React from 'react';

import profile from './assets/profile.JPG';

import './App.css'

import GameOfLife, { meta as GameOfLifeMeta } from './projects/GameOfLife/GameOfLife';
import DijkstraGraph, { meta as DijkstraGraphMeta } from './projects/DijkstraGraph/DijkstraGraph';
import InfixToPostfix, { meta as InfixToPostfixMeta } from './projects/InfixToPostfix/InfixToPostfix';

export default function App() {

    let animationTime = 6;
    let projects = [
        [GameOfLifeMeta], [DijkstraGraphMeta], [InfixToPostfixMeta]
    ];

    return (
        <>
        <header>
            <div>
                <span class="header-text code1">{"<RainHolloway />"}</span>
            </div>
        </header>
        <div className="content-container">
            <div className="about-me">
                <div className="profile-pic">
                    <img src={profile || "https://avatars.githubusercontent.com/u/30580324?v=4"}/>
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
                {
                    projects.map(project => {
                        return <div
                        key={project[0].title}
                        className="project"
                        style={{ animationDelay: `0.${++animationTime}s` }}
                        >
                            <p className="project-title">{ project[0].title }</p>
                            <p className="project-description">{ project[0].description }</p>
                        </div>
                    })
                }
            </div>
        </div>
        </>
    );
}
