
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
    [`${'type'}`]: "StatementList", //Deixando aqui só para lembrar que é possível usar template literals
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

const nodeNames = {
    pai:[
        {filhoEsquerda: [
            'neto1',
            'neto2',
            'neto3'
        ]},
        {filhoMeio: [
            'if',
            'expressão',
            'block'
        ]},
        'filhoDireita'
    ]
}

class TreePattern {


    constructor(structure, nodeNames){

        this.matchPattern = this.createPatternChecker(structure);
        this.matchNames   = this.createNameMatcher(nodeNames);
    }

    process(tree){
        if(this.matchPattern(tree)){

            const nameList = this.matchNames(tree);

            //Objeto que mapeia cada nome a um nó da árvore que satisfez um padrão
            const nameMap = nameList.reduce((obj, nameEntry) => {return {...obj, ...nameEntry}}, {});

            return nameMap;
        }

        return false;
    }

    //Mapeia cada nó da estrutura a um nome designado
    //Retorna lista de (nome: node)
    createNameMatcher(nodeNames){

        if(typeof nodeNames == 'string') return node => {return [{[`${nodeNames}`]: node}]};

        for(const [nodeName, childrenNames] of Object.entries(nodeNames)){

            //retorna a função que agrupa todos os mapeamentos 
            return node => {
                
                const currentNodeEntry = this.createNameMatcher(nodeName)(node)
                
                const childrenNodeEntries = node.children.flatMap((child,i) => this.createNameMatcher(childrenNames[i])(child))

                return currentNodeEntry.concat(childrenNodeEntries);
            }
        }
    }

    //Vê se os nós correspondem a uma estrutura de árvore baseada em seus tipos
    createPatternChecker(structure){

        const isExpectedType = expectedType => node => node.type == expectedType || expectedType == "any";

        if(typeof structure == 'string') return isExpectedType(structure);

        for(const [expectedNodeType, expectedChildren] of Object.entries(structure)){

            //lista de funções que verificam se cada filho satisfaz a estrutura
            const isExpectedChild = expectedChildren.map(child => this.createPatternChecker(child));

            //retorna a função que determina se a criança lida é a esperada
            return node => isExpectedType(expectedNodeType)(node) && node.children.every((child,i) => isExpectedChild[i](child));
        }
    }
}

new TreePattern(structure1, nodeNames).process(test1);