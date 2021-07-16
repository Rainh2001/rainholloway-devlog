import React, { useCallback, useRef, useState } from 'react';

import './InfixToPostfix.css'

export let meta = {
    title: "Infix To Postfix Algebreic Conversion",
    description: "Conversion of algebreic equations from the standard infix notation, to a much more computer interpretable postfix notation with the manipulation of stack data structures",
    link: "https://main.d2q5hpyupt84lv.amplifyapp.com/"
};

class Stack {
    items = [];
    top = () => this.items[this.size() - 1];
    push = (element) => this.items.push(element);
    pop = () => this.items.pop();
    isEmpty = () => this.items.length === 0;
    empty = () => (this.items.length = 0);
    size = () => this.items.length;
}

function getPrecedence(char){
    if(char === "+" || char === "-"){
        return 0;
    } else if(char === "/" || char === "*"){
        return 1;
    } else if(char === "^"){
         return 2;
    }
    return -1;
}

function InfixToPostfix() {

    const equationInput = useRef();

    const [history, setHistory] = useState([]);
    const [historyCount, setHistoryCount] = useState(0);

    const [infix, setInfix] = useState([]);
    const [postfix, setPostfix] = useState([]);

    const [variables, setVariables] = useState({});

    const [answer, setAnswer] = useState(null);
    const [answerHistory, setAnswerHistory] = useState([]);
    const [answerHistoryCount, setAnswerHistoryCount] = useState(0);

    const isNum = (char) => {
        return (char >= '0' && char <= '9');
    }

    const isAlpha = (char) => {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    const isOperator = (char) => {
        let operators = "+-/*^()".split("");
        return operators.indexOf(char) > -1;
    }

    const [postfixNumber, setPostfixNumber] = useState([]);

    const calculateResult = useCallback(infix => {

        const addHistory = (operators, result, infixIndex) => {
            setHistory(current => {
                let newHistory = JSON.parse(JSON.stringify(current));
                newHistory.push({
                    operators, result, infixIndex
                });
                return newHistory;
            });
        }

        setHistory([]);

        let operator = new Stack();
        let results = new Stack();

        addHistory([], [], null);

        for(let i = 0; i < infix.length; i++){
            let c = infix[i];

            if(isAlpha(c) && !(c in variables)){
                setVariables(current => {
                    let newV = JSON.parse(JSON.stringify(current));
                    newV[c] = null;
                    return newV;
                });
            }

            if(isAlpha(c) || isNum(c)){
                results.push(c);
            }

            else if(c === "("){
                operator.push(c);
            }

            else if(c === ")"){
                while(operator.top() !== "("){
                    results.push(operator.pop());
                    addHistory(JSON.parse(JSON.stringify(operator.items)), JSON.parse(JSON.stringify(results.items)), i);
                }
                operator.pop();
            }

            else {
                while(!operator.isEmpty() && getPrecedence(c) <= getPrecedence(operator.top())){
                    results.push(operator.pop());
                    addHistory(JSON.parse(JSON.stringify(operator.items)), JSON.parse(JSON.stringify(results.items)), i);
                }
                operator.push(c);
            }
            addHistory(JSON.parse(JSON.stringify(operator.items)), JSON.parse(JSON.stringify(results.items)), i);
        }

        while(!operator.isEmpty()){
            results.push(operator.pop());
            addHistory(JSON.parse(JSON.stringify(operator.items)), JSON.parse(JSON.stringify(results.items)), null);
        }

        setPostfix(JSON.parse(JSON.stringify(results.items)));
    }, [variables]);


    const calculateAnswer = useCallback(() => {

        setPostfixNumber(() => {
            let arr = [];
            for(let element of postfix){
                if(isAlpha(element)){
                    arr.push(variables[element] || element);
                } else {
                    arr.push(element);
                }
            }
            return arr;
        })

        setAnswerHistory([]);

        const addHistory = (stack, postfixIndex, equation) => {
            setAnswerHistory(current => {
                let newHistory = JSON.parse(JSON.stringify(current));
                newHistory.push({
                    stack, equation, postfixIndex
                });
                return newHistory;
            });
        }

        const getCalculation = (num1, num2, operator) => {
            switch(operator){
                case '+': return num1 + num2;
                case '-': return num1 - num2;
                case '*': return num1 * num2;
                case '/': return num1 / num2;
                case '^': return Math.pow(num1, num2);
                default: return null;
            }
        }

        let stack = new Stack();

        addHistory([], null, null);
       
        for(let i = 0; i < postfix.length; i++){
            let element = postfix[i];
            let calcStr = null;

            if(!isNaN(Number(element))){
                stack.push(Number(element));
            } else if(isAlpha(element)){
                stack.push(variables[element]);
            } else {
                let num2 = stack.pop();
                let num1 = stack.pop();
                let calc = getCalculation(num1, num2, element);
                stack.push(calc);

                calcStr = `${num1} ${element} ${num2} = ${calc}`;
            }

            addHistory(JSON.parse(JSON.stringify(stack.items)), i, calcStr);
        }

        setAnswer(stack.pop());

    }, [postfix, variables]);

    return (
        <div
        className="component-container"
        >
            <div>
                <input ref={equationInput} placeholder="Enter Infix Equation`..." type="text"/>
                <button
                onClick={() => {
                    var equation = equationInput.current.value.replaceAll(" ", "");

                    // Separate constants from variables
                    for(let i = 1; i < equation.length; i++){
                        let [c1, c2] = [equation[i-1], equation[i]];

                        // If c1 is a number and c2 is a letter or vice versa. Also if both are Alpha
                        if((isNum(c1) && isAlpha(c2)) || (isNum(c2) && isAlpha(c1)) || (isAlpha(c1) && isAlpha(c2))){
                            equation = equation.slice(0, i) + '*' + equation.slice(i);
                        }
                    }

                    // Convert string into array of characters, however numbers that are greater than 9 will be longer than 1 character
                    let arr = [];
                    let pos = 0;
                    let currentNum = "";

                    const pushNum = () => {
                        if(currentNum[currentNum.length-1] === "."){
                            currentNum = currentNum.slice(0, currentNum.length-1);
                        }
                        arr.push(currentNum);
                        currentNum = "";
                    }

                    while(pos < equation.length){
                        let char = equation[pos];
                        if(isAlpha(char) || isOperator(char)){

                            if(currentNum.length > 0){
                                pushNum();
                            }

                            arr.push(char);
                        } else if(isNum(char) || char === '.'){
                            currentNum += char;
                            if(isNaN(currentNum)) return;
                        } else return;

                        pos++;
                    }

                    if(currentNum.length > 0){
                        pushNum();
                    }

                    setInfix(arr);
                    setHistoryCount(0);
                    calculateResult(arr);
                }}
                >Convert To Postfix</button>
            </div>
            { infix.length > 0 &&
            <>
                <div
                style={{
                    marginTop: '1rem'
                }}
                >
                    <button
                    onClick={() => {
                        setHistoryCount(current => {
                            if(current === 0) return current;
                            return current - 1;
                        });
                    }}
                    >Previous</button>
                    <button
                    onClick={() => {
                        setHistoryCount(current => {
                            if(current === history.length-1) return current;
                            return current + 1;
                        });
                    }}
                    >Next</button>
                    <span
                    style={{ marginLeft: '1rem' }}
                    >
                        <button
                        onClick={() => setHistoryCount(0)}
                        >Start Again</button>
                        <button
                        onClick={() => setHistoryCount(history.length-1)}
                        >Finish</button>
                    </span>
                </div>

                <div
                style={{
                    marginTop: '1rem'
                }}
                >
                    <span>
                        Infix: <span style={{fontWeight: 'bold'}}>{ infix }</span>
                    </span>
                </div>

                <div
                className="stack-container"
                style={{
                    height: `${infix.length * (25 + 2)}px`
                }}
                >
                    <div
                    className="stack"
                    id="infix-stack"
                    >
                        { 
                            infix.map((char, i) => {
                                let highlighted = history[historyCount].infixIndex === i;
                                return <div
                                key={`${char}${i}`}
                                className="stack-box array-stack-box"
                                style={{
                                    background: highlighted ? "lime" : null,
                                    borderColor: highlighted ? "green" : "grey"
                                }}
                                >
                                    <span>{ char }</span>
                                </div>
                            })
                        }
                    </div>
                    <div
                    className="stack"
                    id="operators-stack"
                    >
                        {
                            history[historyCount].operators.slice().reverse().map((operator, i) => {
                                return <div
                                key={`${operator}${i}`}
                                className="stack-box operator-stack-box"
                                >
                                    { operator }
                                </div>
                            })
                        }
                    </div>
                    <div
                    className="stack"
                    id="results-stack"
                    >
                        {
                            history[historyCount].result.slice().reverse().map((char, i) => {
                                return <div
                                key={`${char}${i}`}
                                className="stack-box result-stack-box"
                                >
                                    { char }
                                </div>
                            })
                        }
                    </div>
                </div>

                <div>
                    <span>
                        Postfix Result: <span style={{fontWeight: 'bold'}}>{ history[historyCount].result.join("") }</span>
                    </span>
                </div>

                {/* Variable assignment container */}
                <div
                className="variable-assignment-container"
                >
                    {
                        Object.keys(variables).map(key => {
                            return <React.Fragment key={key}>
                                <span style={{fontWeight: 'bold'}}>{ key }</span>
                                <span style={{fontWeight: 'bold'}}>=</span>
                                <input 
                                style={{width: '8rem'}} 
                                type="text" 
                                placeholder="Variable value"
                                onChange={event => {
                                    setAnswerHistoryCount(0);
                                    let num = Number(event.target.value);

                                    if(event.target.value === "") num = null;

                                    if(isNaN(num)) return;

                                    setVariables(current => {
                                        let newV = JSON.parse(JSON.stringify(current));
                                        newV[key] = num;
                                        return newV;
                                    });
                                }}
                                />
                            </React.Fragment>
                        })
                    }
                </div>
                {/* Solution Container */}
                <div
                className="solution-container"
                >
                    <button 
                    onClick={() => {
                        for(let num of Object.values(variables)){
                            if(num === null) return; 
                        }
                        setAnswerHistoryCount(0);
                        calculateAnswer();
                    }}
                    >Calculate Answer</button>

                    { answer &&
                    <>
                        <div
                        style={{
                            marginTop: '1rem'
                        }}
                        >
                            <button
                            onClick={() => {
                                setAnswerHistoryCount(current => {
                                    if(current === 0) return current;
                                    return current - 1;
                                });
                            }}
                            >Previous</button>
                            <button
                            onClick={() => {
                                setAnswerHistoryCount(current => {
                                    if(current === answerHistory.length-1) return current;
                                    return current + 1;
                                });
                            }}
                            >Next</button>
                            <span
                            style={{ marginLeft: '1rem' }}
                            >
                                <button
                                onClick={() => setAnswerHistoryCount(0)}
                                >Start Again</button>
                            </span>
                        </div> 

                        <div
                        className="stack-container answer-stack-container"
                        >
                            <div
                            className="stack"
                            id="postfix-stack"
                            >
                                {
                                    postfixNumber.map((element, i) => {
                                        let highlighted = answerHistory[answerHistoryCount].postfixIndex === i;
                                        return <div
                                        key={`${element}${i}`}
                                        className="stack-box array-stack-box"
                                        style={{
                                            background: highlighted ? "lime" : null,
                                            borderColor: highlighted ? "green" : "grey"
                                        }}
                                        >
                                            <span>{ element }</span>
                                        </div>
                                    })
                                }
                            </div>

                            <span>
                                {
                                    answerHistory[answerHistoryCount].equation
                                }
                            </span>

                            <div
                            className="stack"
                            id="number-stack"
                            >
                                {
                                    answerHistory[answerHistoryCount].stack.slice().reverse().map((number, i) => {
                                        return <div
                                        key={`${number}${i}`}
                                        className="stack-box operator-stack-box"
                                        >
                                            { number }
                                        </div>
                                    })
                                }
                            </div>
                        </div>
                    
                        <div style={{marginTop: '0.5rem'}}>
                            <span>Answer: </span><span style={{fontWeight: 'bold'}}>{ answer }</span>
                        </div>
                    </>
                    }                    
                </div>
            </>
            }
        </div>
    );
}

export default InfixToPostfix;