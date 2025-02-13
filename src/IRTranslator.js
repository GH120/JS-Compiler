
class NodeOperations {

    //Dá um nome para o nó label e seta seu tipo para ser 'Label'
    static createLabel(label){

        const randomLabelName = (Math.random() + 1).toString(36).substring(7);

        //Se for repetida, tenta novamente
        if(this.labels.has(randomLabelName)) return this.createLabel(label);

        this.labels.add(randomLabelName);

        label.type = 'Label';
        label.value = randomLabelName;

        return label;
    }

    //Retorna uma função que, para um nó fornecido, busca uma label para atribuir a ele
    //Por exemplo, o bloco true vai receber a label com nome 'LabelT'
    static assignLabel(labelName){
        return (chosenNode, allNodes) => {
            chosenNode.label = allNodes[labelName];
        }
    }
}

class IRTranslate {

    constructor(){
        this.labels = new Set();
    }

    patterns = {


        conditionalPattern: {

            // Estrutura inicial: um condicional if-else
            pattern: {
                IF: [
                    {LT: [
                        "leftOperand", 
                        "rightOperand"
                    ]}, 
                    "Block"
                ]
            },
        
            // Nomes de referência para os nós da árvore
            nodeNames: {
                IF: [
                    {LT: [ 
                        "leftOperand", 
                        "rightOperand"
                    ]}, 
                    'trueBlock', // Bloco verdadeiro
                    'falseBlock' // Bloco falso, opcional
                ]
            },
        
            // Estrutura final: tradução para saltos condicionais e rótulos
            translation: {
                SEQ: [
                    {CJUMP: [
                        "LT", 
                        "leftOperand", 
                        "rightOperand", 
                        "LabelZ", //Caso de duas comparações a<b && a>c
                        "LabelF"
                    ]},
                    { SEQ: [
                        { LABEL: ["LabelZ"] },
                        { CJUMP: ["LT", "leftOperand", "rightOperand", "LabelT", "LabelF"] }
                    ]}
                ]
            },

            applyFunctions: {
                trueBlock:  NodeOperations.assignLabel('LabelT'),
                falseBlock: NodeOperations.assignLabel('LabelF'),
                LabelF:     NodeOperations.createLabel, 
                LabelT:     NodeOperations.createLabel
            }

        },

        conditionalPattern2:{
            pattern: {
                Cx: []
            },
            nodeNames: {
                cx: []
            },
            translation: {
                ESEQ: [
                    { SEQ: [
                        { MOVE: [{ TEMP: ["r"] }, { CONST: ["1"] }] },
                        { SEQ: [
                            "unCx",
                            { SEQ: [
                                { LABEL: ["f"] },
                                { SEQ: [
                                    { MOVE: [{ TEMP: ["r"] }, { CONST: ["0"] }] },
                                    { LABEL: ["t"] }
                                ]}
                            ]}
                        ]}
                    ]},
                    { TEMP: ["r"] }
                ]
            }
        }
    }
}