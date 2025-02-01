export class SemanticAnalyser{

    constructor(){
        this.bindings = {};
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
        this.bindings = {};

        this.scopes = [];

    }

    scopeNodes = {
        ClassDecl: true,
        Block: true,
    }

    assignmentNodes = {
        Assignment: true,
        Declaration: true
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

            const assignment = node.children.some((child) => child.type == "ASSIGN");

            if(assignment) this.addBinding(node, undo);
        }

        /*Insira aqui outras análises, como verificação de retorno de métodos
        
        */
        

        //Visita todos os nós filhos
        node.children.forEach(child => this.visit(child, undo))

        //Termina o escopo arquivando ele em this.scopes e revertendo as mudanças com undo
        if(this.scopeNodes[node.type]) this.endScope(node, undo);
    }

    addBinding(node, undo){
        const assignmentNodes = node.children.filter(n => n.type != "VAR");

        const variable = assignmentNodes[0].token.value;

        const result = assignmentNodes[2];


        //Cria o bucket dessa variável se não existir
        if(!this.bindings[variable]) this.bindings[variable] = [];


        const binding = {type: this.getType(result), form: node.type}

        this.bindings[variable].push(binding);

        undo.push(variable); //Adiciona a variável ao undo
    }

    getType(node){

        const token = node.token;

        const referenceBindings = (token)? this.bindings[node.token.value] : undefined;

        const mappings = {
            NUM: "INT",
            DIV: "INT",
            MULT: "INT",
            MINUS: "INT",
            PLUS: "INT",
            LT: "BOOLEAN",
            TRUE: "BOOLEAN",
            FALSE: "BOOLEAN",
            ID: (referenceBindings)? referenceBindings.map(binding => binding.type) : undefined //Referência para o binding desse valor
        }

        return mappings[node.type]
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
            bindings: copiarBindings(this.bindings)
        });

        this.checkErrors(this.bindings); //Detecta se houve alguma ambiguidade

        undo.forEach(variable => this.bindings[variable].pop()); //Reverte mudanças com undo

    }

    checkErrors(allBindings){

        //Itera sobre todas as variáveis
        for(const [variable, bindings] of Object.entries(allBindings)){

            if(bindings.length == 0) continue; 

            //Tipos aceitos para quando houver várias declarações para a mesma variável
            const acceptedTypes = new Set();

            for(const binding of bindings){

                this.checkBinding(variable, binding, acceptedTypes)
            }
        }
    }

    //Extremamente complicado, perdão a quem for tentar entender
    checkBinding(variable, binding, acceptedTypes){
        
        let referencesOtherBinding = typeof binding.type == 'object';

        //Declarações de tipos diferentes geram variáveis diferentes, as iguais geram erro
        if(binding.form == "Declaration"){

            if(binding.type == undefined){
                console.log(`Variável '${variable}' recebendo variável não declarada `);
            }

            //Declaração pega variável mais recente se referenciar outro binding
            while(referencesOtherBinding){

                const types = binding.type;

                const mostRecentType = types[types.length - 1];

                referencesOtherBinding = typeof mostRecentType.type == 'object';

                if(!referencesOtherBinding) acceptedTypes.add(mostRecentType);
            }
            
            if(acceptedTypes.has(binding.type)) {
                console.log(`Variável '${variable}' com declaração repetida `);
            }

            acceptedTypes.add(binding.type);
        }

        //Assignments só podem ser de uma variável já declarada
        if(binding.form == "Assignment"){

            if(acceptedTypes.size == 0) {
                console.log(`Variável '${variable}' não declarada `);
                return;
            }
            else if(binding.type == undefined){
                console.log(`Variável '${variable}' recebendo variável não declarada `);
            } 

            else if(referencesOtherBinding){

                const searchCompatibleTypes = bind => {
                    
                    if(typeof bind.type != 'object') return acceptedTypes.has(bind);

                    const subBindings = bind.type;

                    return subBindings.map(bind => searchCompatibleTypes(bind)).some(compatible => compatible);
                }

                const hasCompatibleType = searchCompatibleTypes(binding);

                if(!hasCompatibleType) 
                    console.log(`Variável '${variable}' recebendo variável incompatível, tipos compatíveis: ${Array.from(acceptedTypes)} `);
            }

            else if(!acceptedTypes.has(binding.type)){
                console.log(`Variável '${variable}' com tipo ${binding.type} incompatível, tipos compatíveis: ${Array.from(acceptedTypes)} `);
            }
            
        }

    }
    
}