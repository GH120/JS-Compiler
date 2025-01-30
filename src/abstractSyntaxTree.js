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

    return operationsTree
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
    EXP : this.rebalanceTree
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

        return {
          type: node.type,
          children: [newRightChild]
        }
      }

      return node;
  }
}