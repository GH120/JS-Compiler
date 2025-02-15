
// Classe abstrata Access
export class Access {
    constructor(name) {
        if (new.target === Access) {
            throw new Error("Cannot instantiate abstract class Access");
        }
        this.name = name;
    }

    getAccessInfo() {
        throw new Error("Must implement getAccessInfo in subclass");
    }
}
  
// Lista encadeada para Access
export class AccessList {
    constructor(head, tail = null) {
        this.head = head;
        this.tail = tail;
    }

    printList() {
        let current = this;
        while (current) {
            console.log(current.head.name);
            current = current.tail;
        }
    }
}

// Exemplo de uma Subclasse concreta
export class ConcreteFrame extends Frame {
  constructor(name, formals) {
      super(name);
      this.formals = formals;
      this.locals = [];
  }

  newFrame(name, formals) {
      return new ConcreteFrame(name, formals);
  }

  allocLocal(escape) {
      const local = {
          escape: escape,
          offset: this.locals.length
      };
      this.locals.push(local);
      return {
          exp: () => `LOCAL_${local.offset}`
      };
  }

  FP() {
      return "FP";
  }

  procEntryExit1(stms) {
      console.log(`Processing Entry/Exit for ${this.name}`);
      stms.forEach(stm => {
          console.log(stm);
      });
  }
}

