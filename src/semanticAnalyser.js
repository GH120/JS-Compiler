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

    }

    scopeNodes = {
        ClassDecl: true,
        Block: true,
    }

    assignmentNodes = {
        Assignment: "Assignment",
        Declaration: "Declaration"
    }

    varTypes =  {
        NUM: "INT",
        DIV: "INT",
        MULT: "INT",
        MINUS: "INT",
        PLUS: "INT",
        LT: "BOOLEAN",
        TRUE: "BOOLEAN",
        FALSE: "BOOLEAN",
        ID: "ID", //Referência para o binding desse valor
        ASSIGN: "ASSIGN"
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

            if(assignment) this.extractBindings(node, undo);
        }

        /*Insira aqui outras análises, como verificação de retorno de métodos
        
        */
        

        //Visita todos os nós filhos
        node.children.forEach(child => this.visit(child, undo))

        //Termina o escopo arquivando ele em this.scopes e revertendo as mudanças com undo
        if(this.scopeNodes[node.type]) this.endScope(node, undo);
    }

    extractBindings(node, undo){
        const assignmentNodes = node.children.filter(n => n.type != "VAR");

        const variable = assignmentNodes[0].token.value;

        const result = assignmentNodes[2];

        //Cria o bucket dessa variável se não existir
        if(!this.symbolTable[variable]) this.symbolTable[variable] = [];


        const resultType = this.getType(result)

        const variableType = this.symbolTable[variable].map(e => e).pop(); //Tipo da variável vai ser o último tipo dela

        this.checkBinding(variable, variableType, resultType, node.type);

        //Apenas declarações adicionam à stack de bindings
        if(node.type == this.assignmentNodes.Declaration) 
            this.symbolTable[variable].push(resultType);

        undo.push(variable); //Variáveis no undo serão removidas ao final do escopo
    }

    getType(result){

        
        const mappings = this.varTypes;
        
        //Se for ID retorna o último binding do ID referenciado
        if(result.type == mappings.ID){
            
            //Todos os bindings com essa variável
            const variableBindings = (result.token)? this.symbolTable[result.token.value] : undefined;
            
            return (variableBindings)? variableBindings[variableBindings.length - 1] : undefined; //Shadowing da última variável declarada
        }
        
        if(mappings[result.type]) return mappings[result.type];
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

            if(variableType == resultType) 
                console.log(`Variável '${variable}' com declaração repetida `);
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