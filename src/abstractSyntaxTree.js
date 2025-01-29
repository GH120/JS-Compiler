export class AbstractSyntaxTree {

    constructor(astRules) {
        this.rules = astRules;
    }
    
    addRule(nonTerminal, transformFn) {
      this.rules[nonTerminal] = transformFn;
    }
  
    build(node) {
      if (!node || typeof node !== 'object') return node; // Casos básicos

      const transform = this.rules[node.type];

      if(!transform) {

        node.children.forEach(child => this.build(child));

        return node;
      }
      
      const astNode = transform(node);
      
      astNode.children.forEach(child => this.build(child));
  

      return astNode;
    }
  }