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


export class ImperativeSemantics extends SemanticAnalyser{

    constructor(){
        super();

        //Hashtable de bindings vai ser implementada como um objeto, onde cada chave terá um bucket linked list
        this.bindings = {};

        this.scopes = [];

        this.scopeCount = 0;
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


        //Se for um statement, extrai o binding dele
        if(node.type == "Statement"){

            const assignment = node.children.some((child) => child.type == "ASSIGN");

            if(assignment) this.addBinding(node, undo);
        }

        //Percorre para todas os nós filhos
        node.children.forEach(child => this.visit(child, undo))

        //Termina o escopo arquivando ele em this.scopes e revertendo as mudanças com undo
        if(this.scopeNodes[node.type]) this.endScope(node, undo);
    }

    addBinding(node, undo){
        const assignmentNodes = node.children.filter(n => n.type != "VAR");

        const variable = assignmentNodes[0].token.value;

        const result = assignmentNodes[2];


        //Adiciona o bucket dessa variável se não existir
        if(!this.bindings[variable]) this.bindings[variable] = [];

        this.bindings[variable].push(this.getType(result));

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
            ID: (referenceBindings)? referenceBindings[referenceBindings.length - 1] : undefined //Referência para o binding desse valor
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

        this.scopes.push({
            id: this.scopes.length, 
            type: node.type,
            bindings: copiarBindings(this.bindings)
        });

        this.detectAmbiguity(this.bindings); //Detecta se houve alguma ambiguidade

        undo.forEach(variable => this.bindings[variable].pop()); //Reverte mudanças com undo

    }

    detectAmbiguity(bindings){

        for(const [key, binding] of Object.entries(bindings)){

            if(!binding[0]) return console.log(`Variável '${key}' recebendo variável não declarada `);

            const mainType = binding[0];

            if(binding.some(type => type != mainType)) console.log(`Variável '${key}' recebendo tipo incompatível: ` + binding);
        }
    }

    scopeNodes = {
        ClassDecl: true,
        Block: true,
    }
    
}