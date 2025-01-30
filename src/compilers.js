import { AST1 } from "./abstractSyntaxTree.js"
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
        { name: 'EOF', regex: /\./},
    ],
    syntaxRules: (language) => {

        language.addProductionRule("S", ["E", "EOF"])  

        language.addProductionRule("E", ["T", "E1"])  
        language.addProductionRule("E1", ["PLUS", "T", "E1"])  
        language.addProductionRule("E1", ["MINUS", "T", "E1"])  
        language.addProductionRule("E1", [])  //Vazio significa o epsilon

        language.addProductionRule("T", ["F", "T1"])  
        language.addProductionRule("T1", ["MULT", "F", "T1"])  
        language.addProductionRule("T1", ["DIV", "F", "T1"])  
        language.addProductionRule("T1", []) //Vazio significa o epsilon

        language.addProductionRule("F", ["ID"])  
        language.addProductionRule("F", ["NUM"])  
        language.addProductionRule("F", ["LPAR", "E", "RPAR"])  
    },
    parser: LLParser, 
    phases: 2, 
    code: [
        "2*2+(a*b)+(b*c).",
        "2*2+4."
    ],
}

export const compiler6 = {
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
        { name: 'EOF', regex: /\./},
    ],

    syntaxRules: (language) => {
        language.addProductionRule("S", ["E", "EOF"]);
        language.addProductionRule("E", ["T", "E1"]);
        language.addProductionRule("E1", ["PLUS", "T", "E1"]);
        language.addProductionRule("E1", ["MINUS", "T", "E1"]);
        language.addProductionRule("E1", []); // Epsilon
        language.addProductionRule("T", ["F", "T1"]);
        language.addProductionRule("T1", ["MULT", "F", "T1"]);
        language.addProductionRule("T1", ["DIV", "F", "T1"]);
        language.addProductionRule("T1", []); // Epsilon
        language.addProductionRule("F", ["ID"]);
        language.addProductionRule("F", ["NUM"]);
        language.addProductionRule("F", ["LPAR", "E", "RPAR"]);
    },

    //Arvore de sintaxe abstrata construída para essa gramática
    //Caso mude as regras de sintaxe, terá de fazer seu próprio conversor para sintaxe abstrata
    abstractSyntaxTree: new AST1(),
    parser: LLParser,
    phases: 3,
    code: [
        "2*2+(a*b)+(b*c).",
        "2*2+4.",
        "2.",
        "((2*2+(a*b)+(b*c))/5 * 48 * (25+4+2+1+(59*abacate)-22 + 48))/5."
    ],
};

export const compiler7MiniJava =  {
    lexicalRules: [
        { name: 'EOF', regex: /fim/},
        { name: 'CLASS', regex: /class/ },
        { name: 'EXTENDS', regex: /extends/ },
        { name: 'PUBLIC', regex: /public/ },
        { name: 'STATIC', regex: /static/ },
        { name: 'VOID', regex: /void/ },
        { name: 'MAIN', regex: /main/ },
        { name: 'IF', regex: /if/ },
        { name: 'ELSE', regex: /else/ },
        { name: 'WHILE', regex: /while/ },
        { name: 'PRINT', regex: /System.out.println/ },
        { name: 'RETURN', regex: /return/ },
        { name: 'NEW', regex: /new/ },
        { name: 'INT', regex: /int/ },
        { name: 'BOOLEAN', regex: /boolean/ },
        { name: 'TRUE', regex: /true/ },
        { name: 'FALSE', regex: /false/ },
        { name: 'THIS', regex: /this/ },
        { name: 'ID', regex: /[a-zA-Z][a-zA-Z0-9]*/ },
        { name: 'NUM', regex: /[0-9]+/ },
        { name: 'ASSIGN', regex: /=/ },
        { name: 'LPAR', regex: /\(/ },
        { name: 'RPAR', regex: /\)/ },
        { name: 'LBRACE', regex: /\{/ },
        { name: 'RBRACE', regex: /\}/ },
        { name: 'SEMI', regex: /;/ },
        { name: 'COMMA', regex: /,/ },
        { name: 'DOT', regex: /\./ },
        { name: 'PLUS', regex: /\+/ },
        { name: 'MULT', regex: /\*/ },
        { name: 'MINUS', regex: /\-/ },
        { name: 'DIV', regex: /\// },
        { name: 'LT', regex: /</ },
        { name: 'AND', regex: /&&/ },
        { name: 'NOT', regex: /!/ },
        { name: 'LBRACK', regex: /\[/ },
        { name: 'RBRACK', regex: /\]/ },
      ],
    
    syntaxRules: (language) => {

      language.startingSymbol = "Program"

      language.addProductionRule("Program", ["MainClass", "ClassDeclList", "EOF"]);
  
      language.addProductionRule("MainClass", ["CLASS", "ID", "LBRACE", "PUBLIC", "STATIC", "VOID", "MAIN", "LPAR", "FormalList", "RPAR", "Block", "RBRACE"]);
  
      language.addProductionRule("ClassDeclList", ["ClassDecl", "ClassDeclList"]);
      language.addProductionRule("ClassDeclList", []); // Epsilon
  
      language.addProductionRule("ClassDecl", ["CLASS", "ID", "LBRACE", "VarDeclList", "MethodDeclList", "RBRACE"]);
      language.addProductionRule("ClassDecl", ["CLASS", "ID", "EXTENDS", "ID", "LBRACE", "VarDeclList", "MethodDeclList", "RBRACE"]);
  
      language.addProductionRule("VarDeclList", ["VarDecl", "VarDeclList"]);
      language.addProductionRule("VarDeclList", []); // Epsilon
  
      language.addProductionRule("VarDecl", ["Type", "ID", "SEMI"]);
  
      language.addProductionRule("MethodDeclList", ["MethodDecl", "MethodDeclList"]);
      language.addProductionRule("MethodDeclList", []); // Epsilon
  
      language.addProductionRule("MethodDecl", ["PUBLIC", "Type", "ID", "LPAR", "FormalList", "RPAR", "Block", "RETURN", "Exp", "SEMI"]);
  
      language.addProductionRule("FormalList", ["Formal", "COMMA", "FormalList"]);
      language.addProductionRule("FormalList", ["Formal"]);
      language.addProductionRule("FormalList", []); // Epsilon
  
      language.addProductionRule("Formal", ["Type", "ID"]);
  
      language.addProductionRule("Type", ["BaseType", "TypePrime"]);
      language.addProductionRule("TypePrime", ["LBRACK", "RBRACK", "TypePrime"]);
      language.addProductionRule("TypePrime", []); // Epsilon
      language.addProductionRule("BaseType", ["INT"]);
      language.addProductionRule("BaseType", ["BOOLEAN"]);
      language.addProductionRule("BaseType", ["ID"]);
  
      language.addProductionRule("Block", ["LBRACE", "StatementList", "RBRACE"]);
  
      language.addProductionRule("StatementList", ["Statement", "StatementList"]);
      language.addProductionRule("StatementList", []); // Epsilon
  
      language.addProductionRule("Statement", ["Block"]);
      language.addProductionRule("Statement", ["IF", "LPAR", "Exp", "RPAR", "Statement", "Optional"]);
      language.addProductionRule("Statement", ["WHILE", "LPAR", "Exp", "RPAR", "Statement"]);
      language.addProductionRule("Statement", ["PRINT", "LPAR", "Exp", "RPAR", "SEMI"]);
      language.addProductionRule("Statement", ["ID", "ASSIGN", "Exp", "SEMI"]);

      //Elimina recursão à esquerda do statement
      language.addProductionRule( "Optional", ["ELSE", "Statement"])
      language.addProductionRule( "Optional", [])//Epsilon
  
      //Partes de expressões, com recursão à esquerda eliminada
      language.addProductionRule("Exp", ["Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", ["PLUS", "Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", ["MULT", "Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", ["LT", "Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", []); // Epsilon

      language.addProductionRule("Term", ["Factor", "TermPrime"]);
      language.addProductionRule("TermPrime", []); // Epsilon

      language.addProductionRule("Factor", ["NUM"]);
      language.addProductionRule("Factor", ["TRUE"]);
      language.addProductionRule("Factor", ["FALSE"]);
      language.addProductionRule("Factor", ["ID"]);
      language.addProductionRule("Factor", ["THIS"]);
      language.addProductionRule("Factor", ["NEW", "ID", "LPAR", "RPAR"]);
    },
  
    abstractSyntaxTree: null, //Ainda não feita
    parser: LLParser,
    phases: 2,
    code: [
      `class Test {
          public static void main(Test[] args) {
              System.out.println(5 + 2);
          }
      } fim`,
      `class Sample {
          public static void main(Sample[] args) {
              int x = 5;
          }
      } fim`
    ]
};