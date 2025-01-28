import { Language } from "./language.js";
import util from 'util'
import fs from 'fs'


export class TreeVisualizer {

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


export class Parser{

    constructor(language){

        this.language = language;
    }
    
    parse(tokens){
        this.tokens = tokens.map(t => t).reverse();

        this.token = this.getToken();

        this.S();

        return this.syntaxTree;
    }

    getToken(){
        return this.tokens.pop();
    }
}

export class PredictiveParser extends Parser{

    constructor(language){
        super(language);

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


export class LLParser extends Parser{

    constructor(language){

        super(language);

        this.nullable = new Set();
        this.FIRST   = {};
        this.FOLLOW  = {};


    }

    computeSets(){

        const FIRST  = this.FIRST;
        const FOLLOW = this.FOLLOW;

        //Pega todos os terminais e adiciona no conjunto first (geralmente são todos os tokens)
        for(const terminal of this.language.terminals){

            FIRST [terminal] = new Set([terminal]);
            FOLLOW[terminal] = new Set();
        }

        const nonTerminals = new Set(this.language.productionRules.map(rule => rule.variable));

        //Inicializa os conjuntos dos não terminais (variáveis da produção)
        for(const variable of nonTerminals){
            FIRST [variable] = new Set();
            FOLLOW[variable] = new Set();
        }

        //Função autocontida para detectar se houve alteração nos sets
        const detectChange = this.createChangeDetector();

        let i = 0;

        //Enquanto houver mudanças, revisa todas as regras de produção para extrair novas mudanças dos sets
        do{
            for(const production of this.language.productionRules){
                
                const variable = production.variable;
                const symbols  = production.symbols;
                
                //Se todos os símbolos forem anuláveis, então a variável é anulável
                const everySymbolNullable = symbols.every(symbol => this.nullable.has(symbol));
                
                if(everySymbolNullable) this.nullable.add(variable);
                
                //Para cada símbolo da Yi da produção X -> Y1 Y2 ... Yk
                for(let i = 0; i < symbols.length; i++){
                    this.extractNewSets(variable, symbols, i)
                }
           }

           if(i++ > 100) break;
        } while(detectChange());

        return this;
    }

    //X é a variável do tipo X -> Y1...Yi...Yn
    extractNewSets(X, symbols, i){

        const union = function(set1, set2){
            return new Set([...set1.keys(), ...set2.keys()]);
        };

        const FIRST  = this.FIRST;
        const FOLLOW = this.FOLLOW;

        const Yi = symbols[i]; //Yi,
        
        // Adiciona FIRST(Yi) ao FIRST(X) se todos os símbolos anteriores forem anuláveis
        if (i === 0 || symbols.slice(0, i).every(symbol => this.nullable.has(symbol))) {
            
            FIRST[X] = union( FIRST[X], FIRST[Yi]);
        }
        
        // Adiciona FOLLOW(X) ao FOLLOW(Y_i) se todos os símbolos posteriores forem anuláveis
        if (i === symbols.length - 1 || symbols.slice(i + 1).every(symbol => this.nullable.has(symbol))) {

            FOLLOW[Yi] = union(FOLLOW[Yi], FOLLOW[X])
        }
        
        // Adiciona FIRST(Y_j) ao FOLLOW(Y_i) para todos os símbolos Y_j após Y_i
        for (let j = i + 1; j < symbols.length; j++) {
            if (symbols.slice(i + 1, j).every(symbol => this.nullable.has(symbol))) {

                const Yj = symbols[j];

                FOLLOW[Yi] = union(FOLLOW[Yi], FIRST[Yj]);
            }
        }
    }

    createChangeDetector(){
        return () => {
            let nullableLength = this.nullable.length;
            let firstLength   = this.FIRST.length;
            let followLength  = this.FOLLOW.length;

            return () => {
                if(nullableLength != this.nullable.length) return true;
                if(firstLength != this.firstLength.length) return true;
                if(followLength != this.followLength.length) return true;

                return false;
            }
        }
    }
}