import { Language } from "./language.js";
import util from 'util'
import fs from 'fs'


export class Parser{

    constructor(language){

        this.language = language;

        this.syntaxTree = {type: "Start", children: []};

    }
    
    parse(tokens){
        
    }

    getToken(){
        return this.tokens.pop();
    }
}

export class PredictiveParser extends Parser{

    constructor(language){
        super(language);


        this.node = this.syntaxTree;
    }

    parse(tokens){
        this.tokens = tokens.map(t => t).reverse();

        this.token = this.getToken();

        this.S();

        return this.syntaxTree;
    }

    advance(){

        this.token = this.getToken();

        // console.log(util.inspect(this.syntaxTree, {depth: 10, colors: true}))
    }

    eat(token){

        if(this.token.type == token) {
            this.advance();

            this.node.children.push({type: token, children:[]})
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

        const child = {type: type, children: []}

        this.node.children.push(child);

        this.node = child;
    }
}

//Meu amigo, um Set sem union é triste
const union = function(set1, set2){
    return new Set([...set1.keys(), ...set2.keys()]);
};


export class LLParser extends Parser{

    constructor(language){

        super(language);

        this.nullable = new Set();
        this.FIRST   = {};
        this.FOLLOW  = {};

        this.parsingTable = {};
        this.node = this.syntaxTree; //Nó atual do algoritmo de recursive descent

        this.computeSets();
        this.createParsingTable();
    }

    parse(tokens){
        this.tokens = tokens.map(t => t).reverse(); //Reverte para o pop funcionar

        this.token = this.getToken();

        this.applySyntaxRule(this.language.startingSymbol);

        return this.syntaxTree;
    }

    applySyntaxRule(variable, parents=[]){

        //Para construir a árvore sintática, guarda o nó pai na variável
        const node = this.node;

        this.addNode(variable); //Cria esse nó filho e seta o this.node para apontar para ele


        //Escolhe a regra desse par (nãoTerminal, terminal)
        const rule = this.parsingTable[variable][this.token.type]; 

        const nonTerminals = new Set(this.language.productionRules.map(rule => rule.variable));

        const isNonTerminal = (symbol) => nonTerminals.has(symbol);

        // console.log(variable, this.token, rule, parents)

        //Para cada simbolo previsto na regra, vê se encaixa recursivamente
        for(const symbol of rule){

            if(isNonTerminal(symbol)){
                
                this.applySyntaxRule(symbol,[...parents, symbol]); //Se for não terminal, aplica a regra dessa nova variável
            }
            else{
                // console.log("EAT " + symbol)
                this.eat(symbol); //Se for terminal, consome o token e vê se é igual ao token previsto
            }
        }

        // console.log(variable + " COMPLETE")

        this.node = node; //Retorna o escopo do nó para o nó pai
    }

    advance(){
        this.token = this.getToken();
    }

    eat(predictedToken){

        if(this.token.type == predictedToken) {
            this.node.children.push({type: predictedToken, children:[], token: this.token})
            
            this.advance();
        }

        else throw Error("Token esperado: " + predictedToken + "; Token recebido " + this.token.type);
    }

    //Algoritmo pag 49 Modern Compiler Implementation in Java
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
        const detectSetsChange = this.createChangeDetector()();

        detectSetsChange();

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
        } while(detectSetsChange());

        return this;
    }

    //X é a variável do tipo X -> Y1...Yi...Yn
    extractNewSets(X, symbols, i){

        const FIRST  = this.FIRST;
        const FOLLOW = this.FOLLOW;

        const Yi = symbols[i]; 
        
        // Adiciona FIRST(Yi) ao FIRST(X) se todos os símbolos anteriores forem anuláveis
        if (i === 0 || symbols.slice(0, i).every(symbol => this.nullable.has(symbol))) {

            // console.log(FIRST[X], FIRST[Yi], X, Yi)

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

                // console.log(FOLLOW[Yi], FIRST[Yj], Yi, Yj) quando der problemas 

                FOLLOW[Yi] = union(FOLLOW[Yi], FIRST[Yj]);
            }
        }
    }

    createChangeDetector(){
        return () => {

            //Para cada conjunto FIRST[X], retorna seu tamanho e coloca em uma lista
            //Permite comparar se nenhum ítem foi adicionado ou não
            const getSetLengthsArray = (object) =>  Object.values(object).map(set => set.size)
            const equalArrays  = (array1, array2) => array1.length == array2.length && array1.every((item, i) => item == array2[i]);

            //Variáveis de estado da closure
            let nullableLength = this.nullable.length;
            let previousFirst  = getSetLengthsArray(this.FIRST); 
            let previousFollow = getSetLengthsArray(this.FOLLOW)

            //Retorna a closure que vai computar se houve ou não mudança
            return () => {


                const noChange = nullableLength == this.nullable.length    &&
                                 equalArrays(previousFirst,  getSetLengthsArray(this.FIRST)) &&
                                 equalArrays(previousFollow, getSetLengthsArray(this.FOLLOW));

                if(noChange) return false;

                nullableLength = this.nullable.length;
                previousFirst  = getSetLengthsArray(this.FIRST); 
                previousFollow = getSetLengthsArray(this.FOLLOW);

                return true;
            }
        }
    }

    //Com os conjuntos FIRST e FOLLOW computados, cria a tabela de parsing
    createParsingTable(){

        const parsingTable = this.parsingTable;

        // console.log(this.language.productionRules.forEach(production => [production.variable, this.computeFirstForSequence(production.symbols)]))

        for(const production of this.language.productionRules){

            const nonTerminal = production.variable;
            const symbols     = production.symbols;

            if(!parsingTable[nonTerminal]){
                parsingTable[nonTerminal] = {};
            }

            const firstSymbols = this.computeFirstForSequence(symbols);

            for(const terminal of firstSymbols){
                parsingTable[nonTerminal][terminal] = symbols //.toString() //para melhor legibilidade
            }

            if (symbols.length === 0) {
                for (const terminal of this.FOLLOW[nonTerminal]) {
                    parsingTable[nonTerminal][terminal] = []; // Produção vazia (ε)
                }
            }
        }
    }

    //Computa o conjunto first de uma sequência de símbolos
    computeFirstForSequence(symbols) {
        let firstSet = new Set();
    
        for (const symbol of symbols) {

            firstSet = union(firstSet, this.FIRST[symbol]);
    
            if (!this.nullable.has(symbol)) break;  // Para se encontrar um símbolo não anulável
        }
    
        return firstSet;
    }

    addNode(type){

        const child = {type: type, children: []}

        this.node.children.push(child);

        this.node = child;
    }
    
}

export class TreeVisualizer {

    static treeToDot(obj, nodeId = 0, parentId = null, dotLines = []) {
        const currentNodeId = nodeId;
        dotLines.push(`  node${currentNodeId} [label="${obj.type}"];`);

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