import { Lexer } from "./src/lexer.js";
import { Parser } from "./src/parser.js";
import { Language } from "./src/language.js";

class Program{

    constructor(){

        this.Lexer  = new Lexer({
                        conflictResolution: "Rule Priority", 
                        rules: [
                            { name: 'IF', regex: /if/ },
                            { name: 'DECLARATION', regex: /let|var/ },
                            { name: 'WHILE', regex: /while/},
                            { name: 'THEN', regex: /then/},
                            { name: 'DO', regex: /do/},
                            { name: 'ID', regex: /[a-z][a-z0-9]*/ },
                            { name: 'NUM', regex: /[0-9]+/ },
                            { name: 'REAL', regex: /([0-9]+"."[0-9]*)|([0-9]*"."[0-9]+)/ },
                            { name: 'WHITESPACE', regex: /("--"[a-z]*"\n")|(" "|"\n"|"\t")+/ },
                            { name: 'ASSIGN', regex: /=/ },
                            { name: 'LPAR', regex: /\(/ },
                            { name: 'RPAR', regex: /\)/ },
                            { name: 'MULT', regex: /\*/ },
                            { name: 'SEMI', regex: /;/},
                            { name: 'PLUS', regex: /\+/},
                            { name: 'MINUS', regex: /\-/},
                            { name: 'GTHAN', regex: />/},
                            { name: 'LTHAN', regex: /</},
                            { name: 'LBRKT', regex: /{/},
                            { name: 'RBRKT', regex: /}/},
                        ]
                    });

        const language = new Language(this.Lexer.tokenNames, [], []);

        language.addProductionRule("E", ["E", "+", "E"]);
        language.addProductionRule("E", ["ID"]);
        language.addProductionRule("E", ["NUM"]);
        language.addProductionRule("E", ["(", "S","," ,"E", ")"]);
        language.addProductionRule("S", ["S", ";", "S"]);
        language.addProductionRule("S", ["ID", ":", "=", "E"]);
        language.addProductionRule("L", ["E"]);
        language.addProductionRule("L", ["L", ",", "E"]);

        this.Parser = new Parser({
                        language: language
                    });     
    }

    run(sourceCode){

        const tokens = this.Lexer.read(sourceCode);

        console.log(this.Parser.parse(tokens));

        return tokens
    }
}

var code1 = "let v =2; v = v + 2; v = v*v + 2*(v-1)";
var code2 = "while (v < 20) do { if(a > 3) v = k+2}"

console.log(new Program().run(code2))
