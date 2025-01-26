

class Lexer{


    constructor(rules){
        this.regexRules = rules;
    }

    read(string){

        
    }

}

class Parser{
    
}

new Lexer().read("let v = 2; v = v + 2; v = v*v + 2*(v-1)")