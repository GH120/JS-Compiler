export class AbstractSyntaxTree {

    constructor(astRules) {
        this.rules = astRules;
    }
    
    addRule(nonTerminal, transformFn) {
      this.rules[nonTerminal] = transformFn;
    }
  
    build(node) {

      if (!node || typeof node !== 'object') throw Error()

      const transform = this.rules[node.type];


      if(!transform) {

        node.children = node.children.map(child => this.build(child));

        return node;
      }
      
      const astNode = transform(node);
      
      astNode.children = astNode.children.map(child => this.build(child));
  

      return astNode;
    }
  }