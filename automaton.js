import {
    AST,
    RegExpParser,
    parseRegExpLiteral
} from "regexpp";

import fs from 'fs/promises'

const NodeType = {
    initialNode: "initial",
    normalNode: "normal",
    endNode: "end",
    automaton: "automaton",
    rejection: 4
};

export class Node {
    constructor() {
        this.id = Node.generateId();
        this.edges = [];
    }

    static generateId() {
        Node.currentId = (Node.currentId || 0) + 1;
        return Node.currentId;
    }
}

export class NonDeterministicAutomata extends Node{
    constructor() {
        super();
        this.initialNodes = [new Node()];
        this.endNodes = [new Node()];
        this.nodes = [];
        this.edges = [];

        this.addNode(new Node(), "initial");
        this.addNode(new Node(), "end");
    }

    fromRegex(regex) {

        //Rever essa parte, elements depende do tipo visto
        const ast = parseRegExpLiteral(regex);

        const alternatives = ast.pattern.alternatives;

        for(const alternative of alternatives){

            this.extractFromRegexNode(alternative);
        }
        
    }

    extractFromRegexNode(regexNode){

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
            case "CharacterClass": 
                this.addCharacterRange(regexNode);
                break;//[a-e] [b-k]... por exemplo, preencha aqui
            default:
                throw new Error(`Unsupported node type: ${regexNode.type}`);
        }
    }

    addConcatenation(concatenationNode){

        const nodes = concatenationNode.elements;

        const automaton   = this;
        let lastAutomaton = this;
        let subAutomaton  = new NonDeterministicAutomata();

        //Para cada nó extrai o subautomato e concatena ele com o último automato
        for (const node of nodes) {

            subAutomaton.extractFromRegexNode(node); //Função mais embaixo, a depender do tipo do nó extrai um subautomato diferente

            //Concatena o subAutomato na saida do último automato
            automaton.addNode(subAutomaton, NodeType.automaton);

            lastAutomaton.addEdge(lastAutomaton.initialNodes[0], subAutomaton, null);

            lastAutomaton    = subAutomaton;
            subAutomaton     = new NonDeterministicAutomata();
        }

        automaton.addEdge(lastAutomaton, automaton.endNodes[0], null);
    }

    addCharacterRange(node){

        const automaton = this;

        for (const element of node.elements) {

            if (element.type === "Character") {
                // Adiciona um único caractere como uma transição
                automaton.addCharacter(new RegExp(element.raw));
            } else if (element.type === "CharacterClassRange") {
                // Adiciona transições para cada caractere no intervalo
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

        if(startNode == null){
            startNode = this.initialNodes[0];
            this.addNode(startNode, NodeType.initialNode);
        }
        
        if(endNode == null){
            endNode = this.endNodes[0];
            this.addNode(endNode, NodeType.endNode);
        }

        this.addEdge(startNode, endNode, char);
    }

    addNode(node, type) {
        if (!this.nodes.includes(node)) {
            this.nodes.push(node);
        }

        node.type = type;

        switch (type) {
            case NodeType.initialNode:
                if (!this.nodes.includes(node)) this.initialNodes.push(node);
                break;
            case NodeType.endNode:
                if (!this.nodes.includes(node)) this.endNodes.push(node);
                break;
            case NodeType.normalNode:
                break; // Nós normais já são adicionados por padrão
            case NodeType.automaton:
                break;
            default:
                throw new Error(`Invalid node type: ${type}`);
        }
    }

    addEdge(fromNode, toNode, edgeValue = null) {
        if (!fromNode || !toNode) {
            throw new Error("Both fromNode and toNode are required to add an edge.");
        }
        
        // fromNode.edges.push({ to: toNode, value: edgeValue });

        this.edges.push({ from: fromNode, to: toNode, value: edgeValue, id:`[${fromNode.id}, ${toNode.id}]`});
    }

    addLoop(node) {
        const automata = new NonDeterministicAutomata();
        automata.fromRegex(new RegExp(node.element.raw));

        const startNode = new Node();
        const endNode = new Node();

        this.addNode(startNode, NodeType.initialNode);
        this.addNode(endNode,   NodeType.endNode);
        this.addNode(automata,   NodeType.automaton);

        this.addEdge(startNode, automata, null);
        this.addEdge(automata, automata, null);
        this.addEdge(automata, endNode, null);
    }

    addGroup(node) {
        const startNode = new Node();
        const endNode = new Node();

        this.addNode(startNode, NodeType.initialNode);
        this.addNode(endNode,   NodeType.endNode);

        for (const alternative of node.alternatives) {
            const automata = new NonDeterministicAutomata();

            automata.fromRegex(new RegExp(alternative.raw));

            this.addNode(automata, NodeType.automaton);

            this.addEdge(startNode, automata, null);
            this.addEdge(automata,  endNode,  null);
        }
    }

    //Processa os subautomatos transformando-os em nós e arestas
    extractSubautomata(){

        for(const node of this.nodes){

            
            if(node.type != NodeType.automaton) continue;
            
            const automaton = node;

            automaton.extractSubautomata(); //Garante que o automato não terá subautomatos


            //Seleciona arestas conectando a esse automato
            const edgesConectingToAutomaton = this.edges.filter(edge => edge.to == automaton); 

            for(const inputEdge of edgesConectingToAutomaton){

                //Adiciona para cada nó de entrada essa aresta
                automaton.initialNodes.forEach(initialNode => this.addEdge(inputEdge.from, initialNode, inputEdge.value));
            }

            this.edges = this.edges.filter(edge => edge.to != automaton); //Remove as arestas conectando a esse automato


            //Seleciona arestas saindo desse automato
            const edgesFromAutomaton = this.edges.filter(edge => edge.from == automaton); 

            for(const outputEdge of edgesFromAutomaton){

                //Adiciona para cada nó de entrada essa aresta
                automaton.endNodes.forEach(endNode => this.addEdge(endNode, outputEdge.to, outputEdge.value));

            }

        
            //Adiciona arestas e nós do subautomato no automato maior

            automaton.nodes.forEach(node => this.addNode(node, NodeType.normalNode));

            this.edges = this.edges.concat(automaton.edges); //Adiciona todas as arestas do subautomato

            this.edges = this.edges.filter(edge => edge.from != automaton); //Remove as arestas saindo desse subautomato
        }

        //Remove todos os nós automatons
        this.nodes = this.nodes.filter(node => node.type != NodeType.automaton)
    }

    removeNode(node){
        this.nodes = this.nodes.filter(node => node != node);
        this.initialNodes = this.initialNodes.filter(node => node != node);
        this.endNodes = this.endNodes.filter(node => node != node);

        this.edges = this.edges.filter(edge => edge.from != node);
        this.edges = this.edges.filter(edge => edge.to != node);
    }
}

export class DotGraphConverter {
    static toDot(automata) {
        const lines = ["digraph FNA {"];

        // Define node shapes
        lines.push(`  node [shape=circle];`);
        
        // Add initial nodes with a specific shape
        for (const node of automata.initialNodes) {
            lines.push(`  ${node.id} [label="Start" shape=doublecircle];`);
        }

        // Add end nodes with a specific shape
        for (const node of automata.endNodes) {
            lines.push(`  ${node.id} [label="End" shape=doublecircle];`);
        }

        // Add all other nodes
        const normalNodes = automata.nodes.filter(
            node => !automata.initialNodes.includes(node) && !automata.endNodes.includes(node)
        );
        for (const node of normalNodes) {
            lines.push(`  ${node.id} [label="${node.id}"];`);
        }

        // Add edges
        for (const edge of automata.edges) {
            const fromId = edge.from.id;
            const toId = edge.to.id;
            const label = edge.value ? edge.value.toString().replace(/"/g, '\\"') : "ε"; // ε for epsilon transitions
            lines.push(`  ${fromId} -> ${toId} [label="${label}"];`);
        }

        lines.push("}");
        return lines.join("\n");
    }
}

// // Exemplo de uso
const automata = new NonDeterministicAutomata();
automata.fromRegex(/(a|b)c/);

automata.extractSubautomata();

console.log(automata)

const dotRepresentation = DotGraphConverter.toDot(automata);

// File path
const filePath = './graph.dot';

// Write the DOT representation to a file
fs.writeFile(filePath, dotRepresentation, (err) => {
    if (err) {
        console.error("Error writing file:", err);
    } else {
        console.log(`DOT graph written to ${filePath}`);
    }
});


// console.log(automata.nodes[2])

//new NonDeterministicAutomata().fromRegex(/a(b|c)*d?/)

// console.log(parseRegExpLiteral(/(a|b)c/).pattern.alternatives[0].elements[0].alternatives)
