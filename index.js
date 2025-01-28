import { Lexer } from "./src/lexer.js";
import { LLParser, Parser, PredictiveParser, TreeVisualizer } from "./src/parser.js";
import { Language } from "./src/language.js";
import { compiler3, compiler4 } from "./src/compilers.js";

const LEXICAL  = 1;
const SYNTAX   = 2;
const SEMANTIC = 3;
const INTERMEDIATE = 4;
const ALL = 5;

class Program{

    constructor(compiler){

        //Até qual fase vai executar o compilador (Léxica, sintática, ..., todas)
        this.phases = compiler.phases; 

        //Cria o lexer a partir das regras do compilador
        this.lexer  = new Lexer({
                        conflictResolution: "Rule Priority", 
                        rules: compiler.lexicalRules
                    });

        //Cria a linguagem com os tokens da análise léxica sendo os símbolos terminais
        const language = new Language(this.lexer.tokenNames, [], []);

        //Aplica as produções para formar as regras de sintaxe da linguagem
        compiler.syntaxRules(language);
        
        //Passa a linguagem para uma instância do parser do compilador
        this.parser = new compiler.parser(language);    
    }

    run(sourceCode){

        const tokens = this.lexer.read(sourceCode);

        console.log("RESULTADO ANÁLISE LÉXICA: ", tokens);

        if(this.phases < SYNTAX) return;


        const syntaxTree = this.parser.parse(tokens);

        //Escreve no arquivo a árvore sintática 
        TreeVisualizer.writeFile("tree.dot", syntaxTree);

        console.log("RESULTADO ANÁLISE SINTÁTICA INSCRITO NO ARQUIVO " + "tree.dot");

        if(this.phases < SEMANTIC) return;



    }
}

const program = new Program(compiler4);

// program.run(compiler3.code[0])

console.log(new LLParser(program.parser.language).computeSets());