
export class Token{

    constructor(type, value){
        this.type  = type;
        this.value = value;
    }
}

export class Language{

    constructor(terminals, nonTerminals, productionRules){

        this.terminals       = terminals;
        this.nonTerminals    = nonTerminals;
        this.productionRules = productionRules
    }
}