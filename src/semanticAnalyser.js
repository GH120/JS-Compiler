export class SemanticAnalyser{

    constructor(){
        this.symbolTable = {};
        this.scopes   = [];
    }

    analyse(AST){

        //Extrai os bindings para cada contexto
    }

    visit(node){

    }
}

//Semantica Imperativa
export class MiniJavaSemantics extends SemanticAnalyser{

    constructor(){
        super();

        //Hashtable de bindings vai ser implementada como um objeto, onde cada chave terá um bucket linked list
        this.symbolTable = {};

        this.scopes = [];


        //Termos customizáveis para a gramática escolhida
        
        this.scopeNodes = {
            ClassDecl: true,
            Block: true,
            MethodDecl: true,
            MainMethod: true
        }
    
        this.assignmentNodes = {
            Assignment: "Assignment",
            Declaration: "Declaration"
        }
    
        this.varTypes =  {
            NUM: "INT",
            TRUE: "BOOLEAN",
            FALSE: "BOOLEAN",
            ID: "ID", //Referência para o binding desse valor
            ASSIGN: "ASSIGN"
        }


        //Para avaliar expressões vendo se seus termos são de tipos compatíveis
        const intOperation   = (left, right) => (left && right && left == "INT" && right == "INT")? "INT" : undefined;
        const boolComparison = (left, right) => (left && right && left == "INT" && right == "INT")? "BOOLEAN" : undefined;
    
        this.expressionMappings = {
            DIV:   intOperation,
            MULT:  intOperation,
            MINUS: intOperation,
            PLUS:  intOperation,
            LT:    boolComparison,
        }

    }

    analyse(AST){
        
        const undo = [] //Array para reverter environment após sair do escopo

        this.visit(AST, undo);

        return this.scopes;
    }

    visit(node, undo){

        //Cria um novo array de undo para o novo escopo
        if(this.scopeNodes[node.type]) {
            undo = []; 
        };


        //Se for um Assignment, extrai o binding dele
        if(this.assignmentNodes[node.type]){

            const assignment = node.children.some((child) => child.type == this.varTypes.ASSIGN);

            if(assignment){ //Filtra assignmentNodes vazias

                const assignmentNodes = node.children.filter(n => n.type != "VAR");

                const variable = assignmentNodes[0].token.value;

                const result = assignmentNodes[2];
                
                this.bindVariable(variable, result, node.type); //Adiciona a variável a symbolTable e verifica erros

                //Apenas declarações estão no undo
                if(node.type == this.assignmentNodes.Declaration)
                    undo.push(variable); //Variáveis no undo serão removidas ao final do escopo
            }
        }

        /*Insira aqui outras análises, como verificação de retorno de métodos
        
        */
        

        //Visita todos os nós filhos
        node.children.forEach(child => this.visit(child, undo))

        //Termina o escopo arquivando ele em this.scopes e revertendo as mudanças com undo
        if(this.scopeNodes[node.type]) this.endScope(node, undo);
    }

    bindVariable(variable, result, declarationOrAssignment){

        //Cria o bucket dessa variável se não existir
        if(!this.symbolTable[variable]) this.symbolTable[variable] = [];


        //Verifica erros na declaração/atribuição de variáveis
        const resultType = this.getType(result)

        const variableType = this.symbolTable[variable].map(e => e).pop(); //Tipo da variável vai ser o último tipo dela

        this.checkBinding(variable, variableType, resultType, declarationOrAssignment);

        //Apenas declarações adicionam à stack de bindings
        if(declarationOrAssignment == this.assignmentNodes.Declaration) 
            this.symbolTable[variable].push(resultType);
    }

    getType(result){

        const expMappings = this.expressionMappings;
        const varMappings = this.varTypes;
         
        //Se for ID retorna o último binding do ID referenciado (Shadowing)
        if(result.type == varMappings.ID){
            
            //Todos os bindings com essa variável
            const variableBindings = (result.token)? this.symbolTable[result.token.value] : undefined;
            
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

    beginScope(){

        // this.scopeCount++;
    }

    endScope(node, undo){

        //Função para copiar bindings
        const copiarBindings = (bindings) => Object.fromEntries(
                                                Object.entries(bindings)
                                                      .map(entry => [entry[0], [...entry[1]]]) //Copia array de bindings
                                             );

        //Grava uma cópia do escopo atual para a lista de escopos
        this.scopes.push({
            id: this.scopes.length, 
            type: node.type,
            bindings: copiarBindings(this.symbolTable)
        });

        undo.forEach(variable => this.symbolTable[variable].pop()); //Reverte mudanças com undo

    }

    //Extremamente complicado, perdão a quem for tentar entender
    checkBinding(variable, variableType, resultType ,form){
        

        //Declarações de tipos diferentes geram variáveis diferentes, as iguais geram erro
        if(form == "Declaration"){

            if(resultType == undefined){
                console.log(`Variável '${variable}' recebendo variável não declarada `);
            }

            if(variableType == undefined) return; //Padrão, se não houver último tipo na variável então funciona

            // if(variableType == resultType) 
            //     console.log(`Variável '${variable}' com declaração repetida `); 
        }

        //Assignments só podem ser de uma variável já declarada
        if(form == "Assignment"){

            if(variableType == undefined) {
                console.log(`Variável '${variable}' não declarada `);
                return;
            }
            else if(resultType == undefined){
                console.log(`Variável '${variable}' recebendo variável não declarada `);
            } 

            else if(variableType != resultType){
                console.log(`Variável '${variable}' com tipo ${resultType} incompatível, tipos compatíveis: ${variableType} `);
            }
            
        }

    }
    
}