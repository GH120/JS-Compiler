import { Language } from "./language.js";
import util from 'util'
import fs from 'fs'

export class Parser{

    constructor(settings = {
        language: null,
    }){

        this.settings = settings;
    }
    
    parse(tokens){
        this.tokens = tokens.map(t => t).reverse();

        this.token = this.getToken();

        this.S();

        const dotFormat = TreeVisualizer.writeFile("tree.dot",this.syntaxTree);
        console.log(dotFormat);

    }

    getToken(){
        return this.tokens.pop();
    }
}

export class PredictiveParser extends Parser{

    constructor(settings={
        language:null
    }){
        super(settings);

        this.syntaxTree = {value: "Start", children: []};

        this.node = this.syntaxTree;

    }

    advance(){

        this.token = this.getToken();

        // console.log(util.inspect(this.syntaxTree, {depth: 10, colors: true}))
    }

    eat(token){

        if(this.token.type == token) {
            this.advance();

            this.node.children.push({value: token, children:[]})
        }

        else throw Error("Token esperado: " + this.token.type + "; Token recebido " + token);
    }

    S(){
        const node = this.node;

        this.addNode("S");

        console.log(util.inspect(this.node, {depth: 10}))

        switch(this.token.type){

            case "ID": this.eat("ID"); this.eat("ASSIGN"); this.E(); this.L(); break;
            case "BEGIN": this.eat("BEGIN"); this.S(); this.L(); break;
            case "PRINT": this.eat("PRINT"); this.eat("LPAR"); this.E(); this.eat("RPAR"); break;
            default: throw Error("Token não identificado " + this.token.type);
        }

        this.node = node;
    }

    L(){

        const node = this.node;

        this.addNode("L");

        switch(this.token.type){

            case "END": this.eat("END"); break;
            case "SEMI": this.eat("SEMI"); this.S(); this.L(); break;
            default: throw Error("Token não identificado" + this.token.type);
        }

        this.node = node;
    }

    E(){

        const node = this.node;

        this.addNode("E");

        this.eat("ID");

        while(true){

            const tokens = [this.tokens[0], this.tokens[1]]

            try{
                this.eat("PLUS");
                this.eat("ID");
            }
            catch(e){

                this.tokens.concat(tokens)
                break;
            }

        }

        this.node = node;
    }

    addNode(type){

        const child = {value: type, children: []}

        this.node.children.push(child);

        this.node = child;
    }
}

class TreeVisualizer {

    static treeToDot(obj, nodeId = 0, parentId = null, dotLines = []) {
        const currentNodeId = nodeId;
        dotLines.push(`  node${currentNodeId} [label="${obj.value}"];`);

        if (parentId !== null) {
            dotLines.push(`  node${parentId} -> node${currentNodeId};`);
        }

        if (Array.isArray(obj.children)) {
            obj.children.forEach((child, index) => {
                const childNodeId = `${nodeId}_${index}`;
                TreeVisualizer.treeToDot(child, childNodeId, currentNodeId, dotLines);
            });
        }

        return `digraph G {
            rankdir=TB; // Tree-like top-bottom orientation
            node [shape=circle];
            ${dotLines.join("\n")}
        }`;
    }

    static writeFile(filePath, tree) {
        const dotRepresentation = TreeVisualizer.treeToDot(tree);

        // Write the DOT representation to a file
        fs.writeFile(filePath, dotRepresentation, (err) => {
            if (err) {
                console.error("Error writing file:", err);
            } else {
                console.log(`DOT graph written to ${filePath}`);
            }
        });
    }
}
