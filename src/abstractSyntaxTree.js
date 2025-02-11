import util from 'util'

export class AbstractSyntaxTree {
  constructor(astRules) {
      this.rules = astRules;
  }

  addRule(nonTerminal, transformFn) {
      this.rules[nonTerminal] = transformFn;
  }

  // Reconstrói a árvore recursivamente
  build(syntaxTree) {
      
  }
}

export class AST1 extends AbstractSyntaxTree{

  build(syntaxTree){

    //Mesmo eliminando nós redundantes, as operações não estão na ordem certa
    const operationsTree = this.translate(syntaxTree, this.eliminationRules);

    const abstractTree   = this.translate(operationsTree, this.operationOrderInversionRules)

    return abstractTree
  }

  

  // Reconstrói a árvore recursivamente a partir das regras
  translate(node, rules) {
    if (!node || typeof node !== 'object') {
        throw new Error("Invalid node type");
    }

    // Transforma os filhos recursivamente
    node.children = node.children.map(child => this.translate(child, rules));

    const transform = rules[node.type];

    // Retorna o nó transformado ou o nó bruto
    return transform ? transform(node) : node;
  }

  eliminationRules = {
    S: (node) => node.children[0], // Ignora EOF

    E: this.eliminateMainExpression,

    E1: this.eliminateSubexpression,

    T: this.eliminateMainExpression,

    T1: this.eliminateSubexpression,
    
    F: (node) => {
        const children = node.children;
        if (children[0].type === "NUM" || children[0].type === "ID") {
            return children[0];
        }
        return children[1]; // Expressão entre parênteses
    }
  }

  operationOrderInversionRules = {
    PLUS: this.rebalanceTree,
    MULT: this.rebalanceTree,
    DIV:  this.rebalanceTree,
    MINUS: this.rebalanceTree,
    EXP : this.rebalanceTree,
  }

  eliminateMainExpression(node){

    if (node.children.length === 1) return node.children[0];

    const otherOperation = node.children[1];

    if (otherOperation.children.length == 0) return node.children[0];

    if (otherOperation.children.length == 1){
        return {
            type: otherOperation.type,
            children: [node.children[0], otherOperation.children[0]]
        }
    }

    return {
        type: "EXP",
        children: [node.children[0], node.children[1]]
    };
  }

  //Elimina subexpressão retornando sua operação com seus termos
  eliminateSubexpression(node){

    if (node.children.length === 0) return node;

    const otherOperation = node.children[2];

    //Se a outra operação T1 à direita for vazia, retorna o filho esquerdo
    if(otherOperation.children.length == 0) {
        return {
            type: node.children[0].type,
            children: [node.children[1]]
        }
    }

    return {
        type: node.children[0].type,
        children: [node.children[1], node.children[2]]
    };
  }

  rebalanceTree(node){
      const leftChild  = node.children[0];
      const rightChild = node.children[1];
      
      if(!rightChild) return node

      //Se o filho direito tem apenas um filho, então rebalanceia a árvore
      if(rightChild.children.length == 1){
        
        const newRightChild = {
          type: rightChild.type,
          children: [leftChild, rightChild.children[0]]
        }

        //Se for um nó do tipo EXP, então pode ser eliminado
        if(node.type == "EXP") return newRightChild;

        //Se não, retorna o novo nó com um filho só para ser rebalanceado posteriomente
        return {
          type: node.type,
          children: [newRightChild]
        }
      }

      return node;
  }
}

export class MiniJavaAST extends AbstractSyntaxTree{

  build(syntaxTree){

    //Mesmo eliminando nós redundantes, as operações não estão na ordem certa
    const operationsTree = this.translate(syntaxTree, this.firstElimination);

    //Segundo round, ordena operações e elimina partes redundantes como parenteses
    const abstractTree   = this.translate(operationsTree, this.secondElimination)

    return abstractTree
  }

  

  // Reconstrói a árvore recursivamente a partir das regras
  translate(node, rules) {
    if (!node || typeof node !== 'object') {
        throw new Error("Invalid node type");
    }

    // Transforma os filhos recursivamente
    node.children = node.children.map(child => this.translate(child, rules));

    //Elimina filhos nulos
    node.children = node.children.filter(child => !!child);

    const transform = rules[node.type];

    // Retorna o nó transformado ou o nó bruto
    return transform ? transform(node) : node;
  }

  firstElimination = {
    // S: (node) => node.children[0], // Ignora EOF

    Exp: this.eliminateMainExpression,

    ExpPrime: this.eliminateSubexpression,

    Term: this.eliminateMainExpression,

    TermPrime: this.eliminateSubexpression,
    
    Factor: (node) => {
      const child = node.children[0];
      if (
        child.type === "NUM" ||
        child.type === "ID" ||
        child.type === "TRUE" ||
        child.type === "FALSE" ||
        child.type === "THIS"
      ) {
        return child;
      }

      if(child.type == "NEW")
        return {
          type: "NEW_OBJECT",
          id: node.children[1], // ID após NEW
          parameters: [], // Vazio para essa produção
        };

      const EXP = node.children[1];

      return EXP;
    },
    
    // Type: this.eliminateMainExpression,
    BaseType: (node) => node.children[0],
    Array: this.eliminateArray, 
    Type: node => {
      return {
        type: node.children[0].type + node.children[1].value,
        children: [],
      }
    },

    StatementList: this.linearizeRightwardList, 
    FormalList: this.linearizeRightwardList, 
    ClassDeclList: this.linearizeRightwardList, 
    MethodDeclList: this.linearizeRightwardList, 
    VarDeclList: this.linearizeRightwardList, 

    Optional: node => (node.children.length)? {
                                                type: node.children[0].type, 
                                                children: [node.children[1]]
                                              } : null,


    Program: (node) => {return {type: "Program", children: [node.children[0]]}},
    Start: (node) => node.children[0],

    //Remover esses tokens da árvore abstrata, redundantes
    RBRACE: node => null,
    LBRACE: node => null,
    VAR: node => null,
    SEMI: node => null,
    ASSIGN: node => null
  }

  secondElimination = {
    PLUS: this.rebalanceTree,
    MULT: this.rebalanceTree,
    DIV:  this.rebalanceTree,
    LT:   this.rebalanceTree,
    GT:   this.rebalanceTree,
    MINUS: this.rebalanceTree,
    temporary :  this.rebalanceTree,

    //Agora elimina os parênteses redundantes
    LPAR: node => null,
    RPAR: node => null,

    //Simplifica os statements
    Statement: node => {

      //Retorna o primeiro filho se houver apenas ele
      if(node.children.length == 1) return node.children[0];

      //filho direito vira o statement
      return {type: node.children[0].type, children: [...node.children.slice(1)]}
    },
  }

  eliminateMainExpression(node){

    if (node.children.length === 1) return node.children[0];

    const otherOperation = node.children[1];

    if (otherOperation.children.length == 0) return node.children[0];

    if (otherOperation.children.length == 1){
        return {
            type: otherOperation.type,
            children: [node.children[0], otherOperation.children[0]]
        }
    }

    return {
        type: "temporary",
        children: [node.children[0], node.children[1]]
    };
  }

  //Elimina subexpressão retornando sua operação com seus termos
  eliminateSubexpression(node){

    if (node.children.length === 0) return node;

    const otherOperation = node.children[2];

    //Se a outra operação T1 à direita for vazia, retorna o filho esquerdo
    if(otherOperation.children.length == 0) {
        return {
            type: node.children[0].type,
            children: [node.children[1]]
        }
    }

    return {
        type: node.children[0].type,
        children: [node.children[1], node.children[2]]
    };
  }

  eliminateArray(node){

    if (node.children.length === 0) return node;

    //Se a outra operação T1 à direita for vazia, retorna o filho esquerdo
    if(node.children.length == 0) {
        return {
            type: node.type,
            value: "",
            children: []
        }
    }

    const vectorNode = node.children[2];

    return {
        type: node.type,
        value: ((vectorNode.value)? vectorNode.value: "") + "[]",
        children: []
    };
  }

  linearizeRightwardList(node){

    if(node.children.length == 0) return null;

    if(node.children.length == 1) return node.children[0];

    if(node.children.length == 2){

      //Se o filho esquerdo não for uma lista, mantém inalterado o nó
      if(node.children[1].type != node.type) return node

      //todos os netos do segundo filho viram filhos diretos do pai
      //Torna a lista linear fazendo netos virarem filhos
      return {
        type: node.type,
        children: [node.children[0], ...node.children[1].children] 
      }
    }
  }

  rebalanceTree(node){
      const leftChild  = node.children[0];
      const rightChild = node.children[1];
      
      if(!rightChild) return node

      //Se o filho direito tem apenas um filho, então rebalanceia a árvore
      if(rightChild.children.length == 1){
        
        const newRightChild = {
          type: rightChild.type,
          children: [leftChild, rightChild.children[0]]
        }

        //Se for um nó do tipo temporary, então pode ser eliminado
        if(node.type == "temporary") return newRightChild;

        //Se não, retorna o novo nó com um filho só para ser rebalanceado posteriomente
        return {
          type: node.type,
          children: [newRightChild]
        }
      }

      return node;
  }
}