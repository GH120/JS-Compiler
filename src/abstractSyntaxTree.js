export class AbstractSyntaxTree {
  constructor(astRules) {
      this.rules = astRules;
  }

  addRule(nonTerminal, transformFn) {
      this.rules[nonTerminal] = transformFn;
  }

  // Reconstrói a árvore recursivamente
  build(node, depth=0) {
      if (!node || typeof node !== 'object') {
          throw new Error("Invalid node type");
      }

      // if(depth > 1) return node

      // Transforma os filhos recursivamente
      node.children = node.children.map(child => this.build(child, depth+1));

      const transform = this.rules[node.type];

      // Retorna o nó transformado ou o nó bruto
      return transform ? transform(node) : node;
  }
}