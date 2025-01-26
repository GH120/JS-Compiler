import {
    AST,
    RegExpParser,
    parseRegExpLiteral
} from "regexpp";

const NodeType = {
    initialNode: "initial",
    normalNode: "normal",
    endNode: "end",
    automaton: "automaton",
    rejection: 4
};

class Node {
    constructor() {
        this.id = Node.generateId();
        this.edges = [];
    }

    static generateId() {
        Node.currentId = (Node.currentId || 0) + 1;
        return Node.currentId;
    }
}

class NonDeterministicAutomata extends Node{
    constructor() {
        super();
        this.initialNodes = [];
        this.endNodes = [];
        this.nodes = [];
        this.edges = [];
    }

    fromRegex(regex) {

        //Rever essa parte, elements depende do tipo visto
        const ast = parseRegExpLiteral(regex);
        const expressionNodes = ast.pattern.alternatives[0].elements;

        const automaton = this;
        
        processNodes(expressionNodes);

        function processNodes(nodes){
            
            for (const node of nodes) {
                switch (node.type) {
                    case "Character":
                        automaton.addCharacter(new RegExp(node.raw));
                        break;
                    case "Quantifier":
                        automaton.addLoop(node);
                        break;
                    case "CapturingGroup":
                        automaton.addGroup(node);
                        break;
                    case "Alternative":
                        processNodes(node.elements);
                        break;
                    default:
                        throw new Error(`Unsupported node type: ${node.type}`);
                }
            }
        }
    }

    addCharacter(char) {
        const startNode = new Node();
        const endNode = new Node();

        this.addNode(startNode, NodeType.initialNode);
        this.addNode(endNode, NodeType.endNode);
        this.addEdge(startNode, endNode, char);
    }

    addNode(node, type) {
        if (!this.nodes.includes(node)) {
            this.nodes.push(node);
        }

        node.type = type;

        switch (type) {
            case NodeType.initialNode:
                this.initialNodes.push(node);
                break;
            case NodeType.endNode:
                this.endNodes.push(node);
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
        fromNode.edges.push({ to: toNode.id, value: edgeValue });

        this.edges.push({ from: fromNode.id, to: toNode.id, value: edgeValue });
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

            
            if(node.type != NodeType.automaton) return;

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
                automaton.endNodes.forEach(endNode => this.addEdge(endNode, outputEdge.to, inputEdge.value));
            }

            this.edges = this.edges.filter(edge => edge.from != automaton); //Remove as arestas saindo desse automato

        }

        //Remove todos os nós automatons
        this.nodes.forEach(node => (node.type == NodeType.automaton)? this.removeNode(node) : null);
    }
}

// // Exemplo de uso
const automata = new NonDeterministicAutomata();
automata.fromRegex(/a(b|c)*d?/);

console.log(automata)

//new NonDeterministicAutomata().fromRegex(/a(b|c)*d?/)

// console.log(parseRegExpLiteral(/a(b|c)/).pattern.alternatives[0])
