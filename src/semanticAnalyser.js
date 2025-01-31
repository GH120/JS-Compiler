export class SemanticAnalyser{

    constructor(){
        this.bindings = {};
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
    }

    analyse(AST){
        
        this.visit(AST);

        return this.bindings;
    }

    visit(node){

        if(node.type == "Statement"){

            const assignment = node.children[2] && node.children[2].type == "ASSIGN";

            if(assignment)
                this.addBinding(node)
        }

        node.children.forEach(child => this.visit(child))
    }

    addBinding(node){
        const assignmentNodes = node.children.filter(n => n.type != "VAR");

        const variable = assignmentNodes[0].token.value;

        const result = assignmentNodes[2];

        this.bindings[variable] = this.getType(result)
    }

    getType(node){

        const token = node.token;

        const mappings = {
            NUM: "INT",
            DIV: "INT",
            MULT: "INT",
            MINUS: "INT",
            PLUS: "INT",
            ID: (token)? this.bindings[node.token.value] : undefined //Referência para o binding desse valor
        }

        return mappings[node.type]
    }
    
}