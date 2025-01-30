import { Token } from "./language.js";

export class Lexer{

    constructor(settings = {
        conflictResolution: "Longest Match",
        eliminateNonTokens: true,
        rules: []
    }){

        //Regras organizadas em ordem de prioridade
        this.regexRules = settings.rules;
        this.settings   = settings;

    }

    read(string){

        return string.split(" ")
                     .filter(word => !!word) //Retira espaços em branco
                     .flatMap(word => this.match(word))
                     .filter(token => !!token || !this.settings.eliminateNonTokens) //Retira tokens não identificados
                     .map((token, i) => {
                        token.id = i; 
                        return token
                     })
    }

    //Usa rule priority
    match(word){

        const matches = [];
        
        for(const rule of this.regexRules){
            
            const tokenInteiro = new RegExp('^'+rule.regex.source+'$');
            const tokenContido = new RegExp('('+rule.regex.source+')');

            if(tokenContido.test(word)){

                if(tokenInteiro.test(word)) matches.push([new Token(rule.name, word)]);

                else{

                    const partesDoToken = word.split(tokenContido).filter(e => e);

                    const subMatches = partesDoToken.flatMap(parte => this.match(parte));
                    
                    matches.push(subMatches);
                }
            }
        }

        //Matches são um array de arrays[[],[],...]
        //Cada subarray é uma escolha dos tokens que compõem a palavra contígua 
        return matches[0]
    }

    get tokenNames(){
        return this.regexRules.map(rule => rule.name)
    }
}