

class Lexer{

    constructor(settings = {
        conflictResolution: "Longest Match"
    }){

        //Regras organizadas em ordem de prioridade
        this.regexRules = [
            { name: 'IF', regex: /if/ },
            { name: 'DECLARATION', regex: /let|var/ },
            { name: 'ID', regex: /[a-z][a-z0-9]*/ },
            { name: 'NUM', regex: /[0-9]+/ },
            { name: 'REAL', regex: /([0-9]+"."[0-9]*)|([0-9]*"."[0-9]+)/ },
            { name: 'WHITESPACE', regex: /("--"[a-z]*"\n")|(" "|"\n"|"\t")+/ },
            { name: 'ASSIGNMENT', regex: /=/ },
            { name: 'LPAR', regex: /\(/ },
            { name: 'RPAR', regex: /\)/ },
            { name: 'MULT', regex: /\*/ },
            { name: 'STATEMENT', regex: /;/},
            { name: 'PLUS', regex: /\+/},
            { name: 'MINUS', regex: /\-/},
            
        ];

        this.settings = settings;
    }

    read(string){

        console.log(string.split(" ").flatMap(token => this.match(token)))
    }

    match(token){

        const matches = [];
        
        for(const rule of this.regexRules){
            
            const tokenInteiro = new RegExp('^'+rule.regex.source+'$');
            const tokenContido = new RegExp('('+rule.regex.source+')');

            if(tokenContido.test(token)){

                if(tokenInteiro.test(token)) matches.push([rule.name, token])

                else{

                    const partesDoToken = token.split(tokenContido).filter(e => e);

                    const subMatches = partesDoToken.flatMap(parte => this.match(parte));

                    return subMatches;
                }
            }
        }

        
        return [matches[0]]
    }



}

class Parser{
    
}

new Lexer().read("let v =2; v = v + 2; v = v*v + 2*(v-1)")