import { Lexer } from "./src/lexer.js";
import { LLParser, Parser, PredictiveParser, TreeVisualizer } from "./src/parser.js";
import { Language } from "./src/language.js";
import { compiler3, compiler4, compiler5, compiler6, compiler7MiniJava } from "./src/compilers.js";
import { AbstractSyntaxTree } from "./src/abstractSyntaxTree.js";
import util from 'util'

const LEXICAL  = 1;
const SYNTAX   = 2;
const ABSTRACT = 3;
const SEMANTIC = 4;
const INTERMEDIATE = 5;
const ALL = 6;

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

        this.semantics = compiler.semantics;
    }

    run(sourceCode){

        //Análise léxica
        const tokens = this.lexer.read(sourceCode);

        console.log("RESULTADO ANÁLISE LÉXICA: ", tokens);


        //Análise sintática
        if(this.phases < SYNTAX) return;

        const syntaxTree = this.parser.parse(tokens);

        //Escreve no arquivo a árvore sintática 
        TreeVisualizer.writeFile("tree.dot", syntaxTree);

        console.log("RESULTADO ANÁLISE SINTÁTICA INSCRITO NO ARQUIVO " + "tree.dot");

        //Construção da árvore abstrata
        if(this.phases < ABSTRACT) return;

        const AST = this.AST.build(syntaxTree);

        console.log("ÁRVORE DE SINTAXE ABSTRATA INSCRITA NO ARQUIVO " + "ast.dot")

        console.log(util.inspect(AST, {depth:10}))

        TreeVisualizer.writeFile("ast.dot", AST)

        //Análise semântica
        if(this.phases < SEMANTIC) return;

        console.log("ENVIRONMENTS DA ANÁLISE SEMÂNTICA")

        console.log(util.inspect(this.semantics.analyse(AST), {depth:10}))


    }
}

const program = new Program(compiler7MiniJava);

program.run(compiler7MiniJava.code[5])

// console.log(new LLParser(program.parser.language).computeSets());