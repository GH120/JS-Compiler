
export class Token{

    constructor(type, value){
        this.type  = type;
        this.value = value;
    }
}

export class Language{

    constructor(terminals, nonTerminals=[], productionRules={}){

        this.terminals       = terminals;
        this.nonTerminals    = nonTerminals;
        this.productionRules = productionRules;
        this.startingSymbol  = "$"
    }

    addProductionRule(nonTerminal, result){

        if(this.productionRules[nonTerminal] == undefined) 
                this.productionRules[nonTerminal] = [];

        const currentRules = this.productionRules[nonTerminal];

        currentRules.push(result)
    }
}