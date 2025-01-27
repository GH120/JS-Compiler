import {
    AST,
    RegExpParser,
    parseRegExpLiteral
} from "regexpp";

import { NonDeterministicAutomata } from "./automaton.js";

const NodeType = {
    initialNode: "initial",
    normalNode: "normal",
    endNode: "end",
    automaton: "automaton",
    rejection: 4
};


export class AutomataFactory {
    constructor() {
        this.automaton = new NonDeterministicAutomata();
    }

    fromRegex(regex) {
        const ast = parseRegExpLiteral(regex);
        this.extractFromRegexNode(ast.pattern);

        return this.automaton;
    }

    extractFromRegexNode(regexNode) {
        switch (regexNode.type) {
            case "Character":
                this.addCharacter(new RegExp(regexNode.raw));
                break;
            case "Quantifier":
                this.addLoop(regexNode);
                break;
            case "CapturingGroup":
                this.addGroup(regexNode);
                break;
            case "Alternative":
                this.addConcatenation(regexNode);
                break;
            case "Pattern":
                this.addConcatenation({ elements: regexNode.alternatives });
                break;
            case "CharacterClass":
                this.addCharacterRange(regexNode);
                break;
            default:
                throw new Error(`Unsupported node type: ${regexNode.type}`);
        }
    }

    addConcatenation(concatenationNode) {
        const nodes = concatenationNode.elements;
        const automaton = this.automaton;

        let lastAutomaton = null;
        let subAutomaton = new NonDeterministicAutomata();

        automaton.initialNodes.forEach(initialNode =>
            automaton.addEdge(initialNode, subAutomaton, null)
        );

        automaton.addNode(subAutomaton, NodeType.automaton);

        for (const node of nodes) {
            this.extractFromRegexNode(node);

            if (lastAutomaton) {
                lastAutomaton.addNode(subAutomaton, NodeType.automaton);
                lastAutomaton.addEdge(lastAutomaton, subAutomaton, null);
            }

            lastAutomaton = subAutomaton;
            subAutomaton = new NonDeterministicAutomata();
        }

        automaton.endNodes.forEach(endNode =>
            automaton.addEdge(lastAutomaton, endNode, null)
        );
    }

    addCharacterRange(node) {
        const automaton = this.automaton;

        for (const element of node.elements) {
            if (element.type === "Character") {
                automaton.addCharacter(new RegExp(element.raw));
            } else if (element.type === "CharacterClassRange") {
                const startChar = element.min.raw.charCodeAt(0);
                const endChar = element.max.raw.charCodeAt(0);
                for (let charCode = startChar; charCode <= endChar; charCode++) {
                    automaton.addCharacter(new RegExp(String.fromCharCode(charCode)));
                }
            } else {
                throw new Error(`Unsupported CharacterClass element type: ${element.type}`);
            }
        }
    }

    addCharacter(char, startNode = null, endNode = null) {
        const automaton = this.automaton;

        if (startNode == null) {
            startNode = automaton.initialNodes[0];
        }

        if (endNode == null) {
            endNode = automaton.endNodes[0];
        }

        automaton.addEdge(startNode, endNode, char);
    }

    addLoop(node) {
        const automata = new NonDeterministicAutomata();
        automata.fromRegex(new RegExp(node.element.raw));

        const startNode = this.automaton.initialNodes[0];
        const endNode = this.automaton.endNodes[0];

        this.automaton.addNode(startNode, NodeType.initialNode);
        this.automaton.addNode(endNode, NodeType.endNode);
        this.automaton.addNode(automata, NodeType.automaton);

        this.automaton.addEdge(startNode, automata, null);
        this.automaton.addEdge(automata, automata, null);
        this.automaton.addEdge(automata, endNode, null);
    }

    addGroup(node) {
        const startNode = this.automaton.initialNodes[0];
        const endNode = this.automaton.endNodes[0];

        for (const alternative of node.alternatives) {
            const automata = new NonDeterministicAutomata();

            automata.fromRegex(new RegExp(alternative.raw));

            this.automaton.addNode(automata, NodeType.automaton);

            this.automaton.addEdge(startNode, automata, null);
            this.automaton.addEdge(automata, endNode, null);
        }
    }
}