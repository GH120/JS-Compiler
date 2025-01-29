
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