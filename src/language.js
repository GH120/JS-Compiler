
export class Token{

    constructor(type, value){
        this.type  = type;
        this.value = value;
    }
}

export class Language{

    constructor(terminals, nonTerminals = [], productionRules=[], startingSymbol="S"){

        this.terminals       = terminals;
        this.nonTerminals    = nonTerminals;
        this.productionRules = productionRules;
        this.startingSymbol  = startingSymbol;
    }

    addProductionRule(nonTerminal, result){

        this.productionRules.push({variable: nonTerminal, symbols:result});

    }
}

export class SymbolTable {

    constructor(){
        this.environment = {};
    }
}

//Hashtable de bindings vai ser implementada como um objeto, onde cada chave será um bucket do tipo linked list
export class ImperativeSymbolTable extends SymbolTable{

    constructor(){
        super();

        this.undo = [];

        this.scopes = [];
    }

    undoScope(){
        return this.undo[this.undo.length-1];
    }

    beginScope(){

        this.undo.push([]);
    }

    endScope(node){

        //Função para copiar bindings
        const copiarBindings = (bindings) => Object.fromEntries(
                                                Object.entries(bindings)
                                                      .map(entry => [entry[0], [...entry[1]]]) //Copia array de bindings
                                             );

        //Grava uma cópia do escopo atual para a lista de escopos
        this.scopes.push({
            id: this.scopes.length, 
            type: node.type,
            bindings: copiarBindings(this.environment)
        });

        //Todas as operações realizadas nesse escopo
        const operacoesRealizadas = this.undo.pop();

        operacoesRealizadas.forEach(variable => this.environment[variable].pop()); //Reverte mudanças com undo

    }

    //Anexa variável com seu resultado ao environment
    bindVariable(variable, resultType){

        //Cria o bucket dessa variável se não existir
        if(!this.environment[variable]) this.environment[variable] = [];

        //Apenas declarações adicionam à stack de bindings
        this.environment[variable].push(resultType);

        //Adciona variável a lista de undo do escopo
        this.undoScope().push(variable);
    }

    get(variable){

        if(!this.environment[variable]) this.environment[variable] = [];

        return this.environment[variable];
    }
}


export class Node {
    constructor({type, children, value = null, token = null}){
        this.type     = type;
        this.children = children;
        this.value    = value;
        this.token    = token;
    }

    get(childType){
        return this.children.find(c => c.type == childType);
    }

    getAll(childType){
        return this.children.map(c => c.type == childType)
    }

    static convert(objectNode){

        const node = new Node(objectNode);

        node.children = node.children.map(child => new Node(child));

        return node;
    }
}