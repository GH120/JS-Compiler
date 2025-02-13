class IRTranslate {

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
                    'falseBlock' // Bloco falso
                ]
            },
        
            // Estrutura final: tradução para saltos condicionais e rótulos
            translation: {
                SEQ: [
                    {CJUMP: [
                        "LT", 
                        "leftOperand", 
                        "rightOperand", 
                        "LabelZ", 
                        "LabelF"
                    ]},
                    { SEQ: [
                        { LABEL: ["LabelZ"] },
                        { CJUMP: ["LT", "leftOperand", "rightOperand", "LabelT", "LabelF"] }
                    ]}
                ]
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