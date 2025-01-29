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
      const children = (node.children || []).map(child => this.build(child));
      return transform ? transform(children) : node;
    }
  }