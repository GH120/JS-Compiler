import { LLParser, PredictiveParser } from "./parser.js"

export const compiler1 = {
    lexicalRules: [
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
    ],
    exampleCode1: "let v =2; v = v + 2; v = v*v + 2*(v-1)",
    exampleCode2: "while (v < 20) do { if(a > 3) v = k+2}",
    phases: 1
}

export const compiler2 = {
    lexicalRules: [
        { name: 'PRINT', regex: /print/ },
        { name: 'ID', regex: /[a-z][a-z0-9]*/ },
        { name: 'NUM', regex: /[0-9]+/ },
        { name: 'ASSIGN', regex: /=/ },
        { name: 'LPAR', regex: /\(/ },
        { name: 'RPAR', regex: /\)/ },
        { name: 'SEMI', regex: /;/},
        { name: 'PLUS', regex: /\+/},
        { name: 'MULT', regex: /\*/},
        { name: 'DIV', regex: /\//},
    ],
    exampleCode1: "a*b*(b+c)/4",
    exampleCode2: "while (v < 20) do { if(a > 3) v = k+2}",
    phases: 1
}

export const compiler3 = {
    lexicalRules: [
        { name: 'PRINT', regex: /print/ },
        { name: 'BEGIN', regex: /begin/ },
        { name: 'END', regex: /end/ },
        { name: 'ID', regex: /[a-z][a-z0-9]*/ },
        { name: 'NUM', regex: /[0-9]+/ },
        { name: 'ASSIGN', regex: /=/ },
        { name: 'LPAR', regex: /\(/ },
        { name: 'RPAR', regex: /\)/ },
        { name: 'SEMI', regex: /;/},
        { name: 'PLUS', regex: /\+/},
    ],
    syntaxRules: (language) => {

        language.addProductionRule("E", ["E", "+", "T"])
        language.addProductionRule("E", ["E", "-", "T"])
        language.addProductionRule("E", ["T"])

        language.addProductionRule("T", ["T", "*", "F"])
        language.addProductionRule("T", ["T", "/", "F"])
        language.addProductionRule("T", ["F"])

        language.addProductionRule("F", ["ID"])
        language.addProductionRule("F", ["NUM"])
        language.addProductionRule("F", ["(", "E", ")"])
    },
    parser: PredictiveParser, 
    phases: 2, 
    code: [
        "begin alecrim = dourado; dourado = dourado + alecrim + colorado; print(alecrim) end end end",
    ],
}



export const compiler4 = {
    lexicalRules: [
        { name: 'PRINT', regex: /print/ },
        { name: 'BEGIN', regex: /begin/ },
        { name: 'END', regex: /end/ },
        { name: 'ID', regex: /[a-z][a-z0-9]*/ },
        { name: 'NUM', regex: /[0-9]+/ },
        { name: 'ASSIGN', regex: /=/ },
        { name: 'LPAR', regex: /\(/ },
        { name: 'RPAR', regex: /\)/ },
        { name: 'SEMI', regex: /;/},
        { name: 'PLUS', regex: /\+/},
        { name: 'MULT', regex: /\*/},
        { name: 'MINUS', regex: /\-/},
        { name: 'DIV', regex: /\//},
    ],
    syntaxRules: (language) => {

        language.addProductionRule("E", ["E", "PLUS", "T"])
        language.addProductionRule("E", ["E", "MINUS", "T"])
        language.addProductionRule("E", ["T"])

        language.addProductionRule("T", ["T", "MULT", "F"])
        language.addProductionRule("T", ["T", "DIV", "F"])
        language.addProductionRule("T", ["F"])

        language.addProductionRule("F", ["ID"])
        language.addProductionRule("F", ["NUM"])
        language.addProductionRule("F", ["LPAR", "E", "RPAR"])
    },
    parser: LLParser, 
    phases: 2, 
    code: [
        "2*2+(a*b)+(b*c)",
    ],
}


//Eliminada recursão à esquerda
export const compiler5 = {
    lexicalRules: [
        { name: 'PRINT', regex: /print/ },
        { name: 'BEGIN', regex: /begin/ },
        { name: 'END', regex: /end/ },
        { name: 'ID', regex: /[a-z][a-z0-9]*/ },
        { name: 'NUM', regex: /[0-9]+/ },
        { name: 'ASSIGN', regex: /=/ },
        { name: 'LPAR', regex: /\(/ },
        { name: 'RPAR', regex: /\)/ },
        { name: 'SEMI', regex: /;/},
        { name: 'PLUS', regex: /\+/},
        { name: 'MULT', regex: /\*/},
        { name: 'MINUS', regex: /\-/},
        { name: 'DIV', regex: /\//},
        { name: 'EOF', regex: /$/},
    ],
    syntaxRules: (language) => {

        language.addProductionRule("S", ["E", "EOF"])  

        language.addProductionRule("E", ["T", "E'"])  
        language.addProductionRule("E'", ["PLUS", "T", "E'"])  
        language.addProductionRule("E'", ["MINUS", "T", "E'"])  
        language.addProductionRule("E'", [])  //Vazio significa o epsilon

        language.addProductionRule("T", ["F", "T'"])  
        language.addProductionRule("T'", ["MULT", "F", "T'"])  
        language.addProductionRule("T'", ["DIV", "F", "T'"])  
        language.addProductionRule("T'", []) //Vazio significa o epsilon

        language.addProductionRule("F", ["ID"])  
        language.addProductionRule("F", ["NUM"])  
        language.addProductionRule("F", ["LPAR", "E", "RPAR"])  
    },
    parser: LLParser, 
    phases: 2, 
    code: [
        "2*2+(a*b)+(b*c)",
    ],
}


