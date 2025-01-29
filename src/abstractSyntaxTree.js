export class AbstractSyntaxTree {

    constructor(astRules) {
        this.rules = astRules;
    }
    
    addRule(nonTerminal, transformFn) {
      this.rules[nonTerminal] = transformFn;
    }
  
    build(node, depth=0) {

      if (!node || typeof node !== 'object') throw Error()

      if(depth > 1) return node;

      const transform = this.rules[node.type];


      if(!transform) {

        node.children = node.children.map(child => this.build(child, depth+1));

        return node;
      }
      
      const astNode = transform(node);
      
      astNode.children = astNode.children.map(child => this.build(child, depth+1));
  
      return astNode;
    }
  }