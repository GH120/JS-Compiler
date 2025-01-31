import { Lexer } from "./src/lexer.js";
import { LLParser, Parser, PredictiveParser, TreeVisualizer } from "./src/parser.js";
import { Language } from "./src/language.js";
import { compiler3, compiler4, compiler5, compiler6, compiler7MiniJava } from "./src/compilers.js";
import { AbstractSyntaxTree } from "./src/abstractSyntaxTree.js";
import util from 'util'

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
                        rules: compiler.lexicalRules,
                        eliminateNonTokens: true
                    });

        //Cria a linguagem com os tokens da análise léxica sendo os símbolos terminais
        const language = new Language(this.lexer.tokenNames, [], []);

        //Aplica as produções para formar as regras de sintaxe da linguagem
        compiler.syntaxRules(language);
        
        //Passa a linguagem para uma instância do parser do compilador
        this.parser = new compiler.parser(language);   
        
        this.AST = compiler.abstractSyntaxTree;
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

        const AST = this.AST.build(syntaxTree);

        console.log(util.inspect(AST, {depth:10}))

        TreeVisualizer.writeFile("ast.dot", AST)

    }
}

const program = new Program(compiler7MiniJava);

program.run(compiler7MiniJava.code[1])

// console.log(new LLParser(program.parser.language).computeSets());