
const list = {type: "StatementList", id: 0, evaluation: (node) => true};
const any  = {type: null, id: 2, evaluation: node => true};
const leftChild  = {type: null, id: 1, evaluation: node => true};

const structure1 = {
    StatementList: [{
        Statement:[
            'if',
            'exp',
            'block',
        ]},{
        Statement:[
            'exp'
        ]},
        'StatementList'
    ]
}

const test1 = {
    type: "StatementList",
    children: [
        {
            type: "Statement", 
            children:[
                    {type: "if"},
                    {type: "exp"},
                    {type: "block"}
                ]
        },
        {
            type: "Statement",
            children:[
                {type: 'exp'}
            ]
        },
        {type: "StatementList"}
    ]
}

class TreePattern {

    process(structure){

        const isExpectedType = expectedType => node => node.type == expectedType || expectedType == "any";

        if(typeof structure == 'string') return isExpectedType(structure);

        for(const [expectedNodeType, expectedChildren] of Object.entries(structure)){

            //lista de funções que verificam se cada filho satisfaz a estrutura
            const isExpectedChild = expectedChildren.map(child => this.process(child));

            //retorna a função que determina se a criança lida é a esperada
            return node => isExpectedType(expectedNodeType)(node) && node.children.every((child,i) => isExpectedChild[i](child));
        }
    }
}

new TreePattern().process(structure1)(test1);