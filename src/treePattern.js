
const list = {type: "StatementList", id: 0, evaluation: (node) => true};
const any  = {type: null, id: 2, evaluation: node => true};
const leftChild  = {type: null, id: 1, evaluation: node => true};

class TreePattern {


    constructor(structure, nodeNames){

        this.matchPattern = this.createPatternChecker(structure);
        this.matchNames   = this.createNameMatcher(nodeNames);
    }

    visit(tree){
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

export class TreeTranslator{

    constructor(structure, nodeNames, newStructure, nodeOperations = {}){

        this.treePattern     =   new TreePattern(structure, nodeNames);
        this.newStructure    =   newStructure;
        this.nodeOperations  =   nodeOperations; //Operações pós processamento, para gerar labels, temps ou outros..
    }

    visit(tree){
        //Retorna um objeto com entries name: node
        const allNodes = this.treePattern.visit(tree);

        if(allNodes == false) return false;

        //Reconstroi a nova estrutura mapeando os nomes dela com os nós da árvore 
        const translatedTree = this.reconstruct(this.newStructure, allNodes);

        //Retorna a árvore após aplicar operações escolhidas para cada nó
        //Usado para criar labels, temps, e designar labels para blocos e funções
        this.applyOperations(allNodes);
        
        return translatedTree;
    }

    reconstruct(newStructure, allNodes){

        //Nó da árvore com nome igual ao da estrutura, 
        //se não houver nó existente, criar nó novo
        const getNode = (name) => this.getNode(allNodes, name);

        if(typeof newStructure == 'string'){

            const nodeName = newStructure;

            return getNode(nodeName);
        }
        
        for(const [nodeName, childrenStructure] of Object.entries(newStructure)){

            const node = getNode(nodeName);

            //Reconstroi os filhos da estrutura desse nó
            node.children = childrenStructure.map(child => this.reconstruct(child, allNodes));

            //Se não houver filhos, substituir undefined por array vazio
            node.children = (node.children)? node.children : [];

            return node;
        }
    }

    applyOperations(allNodes){

        //Para cada par nome : operação, aplicar pós processamento no nó com esse nome
        for(const [nodeName, operation] of Object.entries(this.nodeOperations)){
            
            const node = allNodes[nodeName];

            //Operação sobre o nó especifico, usando o contexto de todos os nós
            operation(node, allNodes);
        }
    }

    getNode(allNodes, name){

        const node = (allNodes[name])? allNodes[name] : {type: name, children: []};

        allNodes[name] = node;

        return node;
    }
}

export class TreeBuilder{

    constructor(structure, nodeOperations){
        this.structure      = structure;
        this.nodeOperations = nodeOperations;
    }

    build(){

        const allNodes = {};

        const tree = this.reconstruct(this.structure, allNodes); //Constroi do zero a nova estrutura

        this.applyOperations(allNodes);

        //Elimina os IDs do tipo dos nós, por exemplo o nó EXP_1 vira só EXP
        Object.values(allNodes).map(node => node.type = node.type.split('_')[0]); 

        return tree;
    }
    
    reconstruct(structure, allNodes){

        //Nó da árvore com nome igual ao da estrutura, 
        //se não houver nó existente, criar nó novo
        const createNode = (name) => this.createNode(allNodes, name);

        if(typeof structure == 'string'){

            const nodeName = structure;

            return createNode(nodeName);
        }
        
        for(const [nodeName, childrenStructure] of Object.entries(structure)){

            const node = createNode(nodeName);

            //Reconstroi os filhos da estrutura desse nó
            node.children = childrenStructure.map(child => this.reconstruct(child, allNodes));

            //Se não houver filhos, substituir undefined por array vazio
            node.children = (node.children)? node.children : [];

            return node;
        }
    }

    applyOperations(allNodes){

        //Para cada par nome : operação, aplicar pós processamento no nó com esse nome
        for(const [nodeName, operation] of Object.entries(this.nodeOperations)){
            
            const node = allNodes[nodeName];

            //Operação sobre o nó especifico, usando o contexto de todos os nós
            operation(node, allNodes);
        }
    }

    //Para tipos repetidos
    createNode(allNodes, name){

        //Se tiver nome repetido, incrementa o id e repete novamente
        if(allNodes[name]){
            
            const id = parseInt(name.split('_')[1]);

            name = (id)? `${name}_${id+1}` : name;
            
            return this.createNode(allNodes, name);
        }

        const node = {type:name, children: []}

        //Cria um novo nó com o tipo sendo seu nome
        allNodes[name] = node;

        return node;
    }
}



const tree1 = {
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
                {type: 'exp'},
                {type: 'exp'},
                {type: 'exp'}

            ]
        },
        {type: "StatementList"}
    ]
}


const structure1 = {
    StatementList: [{
        Statement:[
            'if',
            'exp',
            'block',
        ]},{
        Statement:[
            'exp',
            'exp',
            'exp',
        ]},
        'StatementList'
    ]
}

const nodeNames = {
    pai:[
        {filhoEsquerda: [
            'if',
            'expressão1',
            'block'
        ]},
        {filhoMeio: [
            'expressão2',
            'expressão3',
            'expressão4'
        ]},
        'filhoDireita'
    ]
}

const newStructure = {
    pai: [
        'filhoMeio', 
        {filhoDireita: [
            'filhoEsquerda'
        ]}, 
        {clone: [
            'teste1',
            'teste2'
        ]}
    ]
};

const postProcessing = {
    pai: (pai, allNodes) => {
        pai.filhos = pai.children.length;
    }
}



new TreeTranslator(structure1, nodeNames, newStructure, postProcessing).visit(tree1);


const arvore = {
    MEM: [
        {BINOP_0:[
            'PLUS_0',
            'EXP_1',
            {BINOP_1: [
                'PLUS_1',
                {BINOP_2:[
                    'PLUS_2',
                    'CONST_1',
                    'EXP_2'
                ]},
                'CONST_2'
            ]},
        ]}
    ]
};

const operations = {
    CONST_1: (node) => node.value = 1,
    CONST_2: (node) => node.value = 3,
    EXP_1:   (node) => node.children = ['abacate'],
    EXP_2:   (node) => node.children = ['mostarda']
}

new TreeBuilder(arvore, operations).build()