import { AST1, MiniJavaAST } from "./abstractSyntaxTree.js"
import { LLParser, PredictiveParser } from "./parser.js"
import { MiniJavaSemantics } from "./semanticAnalyser.js"

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

        language.addProductionRule("E", ["E", "EOF"])


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
        "2*2+(a*b)+(b*c)",
        "2*2+4"
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
        "2*2+(a*b)+(b*c)",
        "2*2+4",
        "2",
        "((2*2+(a*b)+(b*c))/5 * 48 * (25+4+2+1+(59*abacate)-22 + 48))/5"
    ],
};

export const compiler7MiniJava =  {

    preProcessing: [
        { name: 'COMMENT', regex: /\/\/.*\n/}
    ],
    lexicalRules: [
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
        { name: 'VAR', regex: /var/ },
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
        { name: 'EOF', regex: /fim/}, //Modificar depois, precisa de algum EOF manual para terminar a execução
      ],
    
    syntaxRules: (language) => {

      language.startingSymbol = "Program"

      language.addProductionRule("Program", [ "ClassDeclList", "EOF"]);
  
      //Gramática das classes
      language.addProductionRule("ClassDeclList", ["ClassDecl", "ClassDeclList"]);
      language.addProductionRule("ClassDeclList", []); // Epsilon
  
      language.addProductionRule("ClassDecl",  ["CLASS", "ID", "SuperClass", "LBRACE", "VarDeclList","PUBLIC", "MainMethod", "MethodDeclList", "RBRACE"]);

      language.addProductionRule("SuperClass", ["EXTENDS", "ID"])
      language.addProductionRule("SuperClass", []) //Epsilon
  
      language.addProductionRule("VarDeclList", ["VarDecl", "VarDeclList"]);
      language.addProductionRule("VarDeclList", []); // Epsilon
  
      language.addProductionRule("VarDecl", ["Type", "ID", "SEMI"]);
  

      //Gramática de métodos

      language.addProductionRule("MethodDeclList", ["MethodDecl", "MethodDeclList"]);
      language.addProductionRule("MethodDeclList", []); // Epsilon

      language.addProductionRule("MainMethod", [ "STATIC", "VOID", "MAIN", "LPAR", "FormalList", "RPAR", "Block"])
      language.addProductionRule("MainMethod", []) //Epsilon
  
      language.addProductionRule("MethodDecl", ["PUBLIC", "Type", "ID", "LPAR", "FormalList", "RPAR", "Block", "ReturnType"]);
      language.addProductionRule("ReturnType", ["RETURN", "Exp", "SEMI"])
      language.addProductionRule("ReturnType", []);
  
      language.addProductionRule("FormalList", ["Formal", "COMMA", "FormalList"]);
      language.addProductionRule("FormalList", ["Formal"]);
      language.addProductionRule("FormalList", []); // Epsilon
  
      language.addProductionRule("Formal", ["Type", "ID"]);

      //Gramática de tipos primitivos e arrays
      language.addProductionRule("Type", ["BaseType", "Array"]);
      language.addProductionRule("Array", ["LBRACK", "RBRACK", "Array"]);
      language.addProductionRule("Array", []); // Epsilon
      language.addProductionRule("BaseType", ["INT"]);
      language.addProductionRule("BaseType", ["BOOLEAN"]);
      language.addProductionRule("BaseType", ["ID"]);
  

      //Gramática de Statements
      language.addProductionRule("Block", ["LBRACE", "StatementList", "RBRACE"]);
  
      language.addProductionRule("StatementList", ["Statement", "StatementList"]);
      language.addProductionRule("StatementList", []); // Epsilon
  
      language.addProductionRule("Statement", ["Block"]);
      language.addProductionRule("Statement", ["IF", "LPAR", "Exp", "RPAR", "Block", "Optional"]); //Escolhido Block para evitar problema do dangling else
      language.addProductionRule("Statement", ["WHILE", "LPAR", "Exp", "RPAR", "Statement"]);
      language.addProductionRule("Statement", ["PRINT", "LPAR", "Exp", "RPAR", "SEMI"]);
      language.addProductionRule("Statement", ["Assignment"]);
      language.addProductionRule("Statement", ["Declaration"]); 

      language.addProductionRule("Declaration", ["VAR", "ID", "ASSIGN", "Exp", "SEMI"]); //DECLARAÇÃO APENAS COM 'VAR', LIMITAÇÃO DA AMBIGUIDADE TYPE ID
      language.addProductionRule("Assignment", ["ID", "ASSIGN", "Exp", "SEMI"]); 

      //Elimina recursão à esquerda do statement
      language.addProductionRule( "Optional", ["ELSE", "Statement"])
      language.addProductionRule( "Optional", [])//Epsilon
  
      //Partes de expressões, com recursão à esquerda eliminada
      language.addProductionRule("Exp", ["Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", ["PLUS", "Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", ["MINUS", "Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", ["LT", "Term", "ExpPrime"]);
      language.addProductionRule("ExpPrime", []); // Epsilon

      language.addProductionRule("Term", ["Factor", "TermPrime"]);
      language.addProductionRule("TermPrime", ["MULT", "Factor", "TermPrime"]);
      language.addProductionRule("TermPrime", ["DIV", "Factor", "TermPrime"]);
      language.addProductionRule("TermPrime", []); // Epsilon

      language.addProductionRule("Factor", ["NUM"]);
      language.addProductionRule("Factor", ["TRUE"]);
      language.addProductionRule("Factor", ["FALSE"]);
      language.addProductionRule("Factor", ["ID"]);
      language.addProductionRule("Factor", ["THIS"]);
      language.addProductionRule("Factor", ["NEW", "ID", "LPAR", "RPAR"]);
      language.addProductionRule("Factor", ["LPAR", "Exp", "RPAR"]);
    },
  
    parser: LLParser,
    abstractSyntaxTree: new MiniJavaAST(), 
    semantics: new MiniJavaSemantics({

        //Nós de escopo
        scopeNodes: {
            ClassDecl: true,
            Block: true,
            MethodDecl: true,
            MainMethod: true
        },
    
        //Nós de declaração
        assignmentNodes: {
            Assignment: "Assignment",
            Declaration: "Declaration"
        },
    
        //Tipos que as variáveis podem assumir
        varTypes:  {
            NUM: "INT",
            TRUE: "BOOLEAN",
            FALSE: "BOOLEAN",
            ID: "ID", //Referência para o binding desse valor
            ASSIGN: "ASSIGN"
        },
    
        //Tipo do resultado de cada expressão
        expressionMappings: {
            DIV:   (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            MULT:  (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            MINUS: (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            PLUS:  (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            LT:    (left, right) => (left && right && left == "INT" && right == "INT")? "BOOLEAN" : undefined,
        }

    }),
    phases: 4,
    code: [
      `class Test {
          public static void main(Test[] args) {
              System.out.println(5 + 2);
          }
      } `,
      `class Sample {
          public static void main(Sample[] args) {
              var a = 2;
              var b = 3;
              var c = 30;
              var abacate = 1;
              var x = ((2*2+(a*b)+(b*c))/5 * 48 * (25+4+2+1+(59*abacate)-22 + 48))/5;
          }
      } `,
       `
        class HelloWorld {
            public static void main(HelloWorld[] args) {
                System.out.println(42); 
            }
        }

        class ArithmeticExample {
            public static void main(ArithmeticExample[] args) {
                var a = 10;
                var b = 5;
                var sum = a + b;
                System.out.println(sum); 
            }
        }

        class WhileLoopExample {
            public static void main(WhileLoopExample[] args) {
                var count = 0;
                while (count < 3) {
                    System.out.println(count); 
                    count = count + 1;
                }
            }
        }

       `,

       `
       class ArithmeticExample {
            public static void main(ArithmeticExample[] args) {
                var a = 10;
                var b = 5;
                b = true;
                var sum = a;
                sum = b;
                var sum2 = a + b;

                if(a < b){
                    var josias = abacate;
                    sum = 22;
                    a = true;
                }
                System.out.println(sum); 
            }
        }
       `,

       `
       class ArithmeticExample {
            public static void main(ArithmeticExample[] args) {
                var a = 10;
                var b = 5;

                if(a < b){
                    var a = true;
                    var b = false;
                }
                System.out.println(sum); 
            }
        }
       `,

       `
       class ArithmeticExample {
       
            public static void main(ArithmeticExample[] args) {
                var a = 10;
                var b = 5;
                a = 2;

                if(a < b){
                    var c = true;
                    var b = true;
                    var d = false;
                    b = a;
                    a = b;
                }
                else {
                    var c = 2;
                    var d = a;
                    var k = baltazar;
                    d = true;
                    calvino = calvo;
                }

                if(a < b){
                    var c = 3;
                    var abacate = 1;
                    var x = ((2*2+(a*b)+(b*c))/5 * 48 * (25+4+2+1+(59*abacate)-22 + 48))/5;
                }
                System.out.println(sum); 
            }
        }
       `,
       //Erro por causa da falha em analisar vif (contém if)
       `
       class ArithmeticExample {
       
            public static void main(ArithmeticExample[] args) {
                var a = 10;
                var b = 5;
                a = 2;

                if(a < b){
                    var c = true;
                    var b = true;
                    var d = false;
                    b = a;
                    a = b;
                }
                else {
                    var c = 2;
                    var d = a;
                    var vif = baltazar;
                    d = true;
                    calvino = calvo;
                }

                if(a < b){
                    var c = 3;
                    var abacate = 1;
                    var x = ((2*2+(a*b)+(b*c))/5 * 48 * (25+4+2+1+(59*abacate)-22 + 48))/5;
                }
                System.out.println(sum); 
            }
        }
       `
    ]
};