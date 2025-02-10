import { ImperativeSymbolTable, SymbolTable } from "./language.js";

export class SemanticAnalyser{

    constructor(){
        this.symbolTable = new SymbolTable();
        this.scopes   = [];
    }

    analyse(AST){

        //Extrai os bindings para cada contexto
    }

    visit(node){

    }
}

//Semantica Imperativa
//Dividir parte de tabela de símbolos da árvore semântica
export class MiniJavaSemantics extends SemanticAnalyser{

    constructor(settings){
        super();

        //Hashtable imperativa, destroi environment ao sair do escopo
        this.symbolTable = new ImperativeSymbolTable();

        if(settings) this.settings = settings;

        //Termos customizáveis para a gramática escolhida

    }

    //Configuração padrão para o minijava 
    settings = {
        scopeNodes: {
            ClassDecl: true,
            Block: true,
            MethodDecl: true,
            MainMethod: true
        },
    
        assignmentNodes: {
            Assignment: "Assignment",
            Declaration: "Declaration"
        },
    
        varTypes:  {
            NUM: "INT",
            TRUE: "BOOLEAN",
            FALSE: "BOOLEAN",
            ID: "ID", //Referência para o binding desse valor
            ASSIGN: "ASSIGN"
        },
    
        expressionMappings: {
            DIV:   (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            MULT:  (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            MINUS: (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            PLUS:  (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined,
            LT:    (left, right) => (left && right && left == "INT" && right == "INT")? "BOOLEAN" : undefined,
        }
    }

    analyse(AST){
        
        this.visit(AST);

        return this.symbolTable.scopes;
    }

    visit(node){

        const isScope      = this.settings.scopeNodes[node.type];
        const isAssignment = this.settings.assignmentNodes[node.type];

        //Inicia novo escopo caso seja bloco, método, classe...
        if(isScope) this.symbolTable.beginScope();


        //Se for um Assignment, extrai o binding dele
        if(isAssignment) this.extractBindings(node);

        /*Insira aqui outras análises, como verificação de retorno de métodos
        
        */

        //Visita todos os nós filhos
        node.children.forEach(child => this.visit(child))

        //Termina o escopo atual, revertendo mudanças na tabela de símbolos
        if(isScope) this.symbolTable.endScope(node);
    }

    extractBindings(node){

        //Espera que a árvore abstrata tenha declarações/assignments com apenas dois filhos: variável e resultado
        const variable      = node.children[0].token.value;
        const result        = node.children[1];
        const resultType    = this.getType(result)
        const variableType  = this.symbolTable.get(variable).map(e => e).pop(); //Tipo da variável vai ser o último tipo dela
        const isDeclaration = (node.type == this.settings.assignmentNodes.Declaration);

        //Verifica erros na declaração de variáveis
        const valid = this.checkAssignmentErrors(variable, variableType, resultType, isDeclaration);

        //Apenas declarações associam novos tipos
        if(isDeclaration && valid) this.symbolTable.bindVariable(variable, resultType);
    }

    getType(result){

        const expMappings = this.settings.expressionMappings;
        const varMappings = this.settings.varTypes;
         
        //Se for ID retorna o último binding do ID referenciado (Shadowing)
        if(result.type == varMappings.ID){
            
            //Todos os bindings com essa variável
            const variableBindings = (result.token)? this.symbolTable.get(result.token.value) : undefined;
            
            return (variableBindings)? variableBindings[variableBindings.length - 1] : undefined; //Shadowing da última variável declarada
        }

        //Se for uma expressão, vê se se encaixa com os tipos requiridos recusivamente
        //Se não se encaixar, retorna undefined
        else if(expMappings[result.type]){

            const matchExpressionType = expMappings[result.type];

            const leftNode = result.children[0];

            const rightNode = result.children[1];

            return matchExpressionType(
                    this.getType(leftNode), 
                    this.getType(rightNode)
            );
        }
        
        else if(varMappings[result.type]) 
            return varMappings[result.type];
    }

    //Verifica erros de declaração e associação
    checkAssignmentErrors(variable, variableType, resultType ,isDeclaration){
        

        //Declarações de tipos diferentes geram variáveis diferentes, as iguais geram erro
        if(isDeclaration){

            if(resultType == undefined){
                console.log(`Variável '${variable}' recebendo variável não declarada `);
                return false;
            }

            if(variableType == undefined) return true; //Padrão, se não houver último tipo na variável então funciona

            // if(variableType == resultType) 
            //     console.log(`Variável '${variable}' com declaração repetida `); 
        }

        //Assignments só podem ser de uma variável já declarada
        else{

            if(variableType == undefined) {
                console.log(`Variável '${variable}' não declarada `);
                return false;
            }
            else if(resultType == undefined){
                console.log(`Variável '${variable}' recebendo variável não declarada `);
                return false;
            } 

            else if(variableType != resultType){
                console.log(`Variável '${variable}' com tipo ${resultType} incompatível, tipos compatíveis: ${variableType} `);
                return false;
            }
            
        }

        return true;

    }
    
}