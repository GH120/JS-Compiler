
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
  
// Classe abstrata Frame
export class Frame {
    constructor(name) {
        if (new.target === Frame) {
            throw new Error("Cannot instantiate abstract class Frame");
        }
        this.name = name;
        this.formals = null;
    }

    newFrame(name, formals) {
        throw new Error("Must implement newFrame in subclass");
    }

    allocLocal(escape) {
        throw new Error("Must implement allocLocal in subclass");
    }
}


// Classe Temp
class Temp {
    constructor() {
      this.id = `t${Math.floor(Math.random() * 1000)}`;
    }
  
    toString() {
      return this.id;
    }
  }
  
  // Classe Label
  class Label {
    constructor(value) {
      if (value instanceof Symbol) {
        this.value = value.description;
      } else if (typeof value === 'string') {
        this.value = value;
      } else {
        this.value = `L${Math.floor(Math.random() * 1000)}`;
      }
    }
  
    toString() {
      return this.value;
    }
  }
  
  // Classe TempList (lista encadeada de Temp)
  class TempList {
    constructor(head = null, tail = null) {
      this.head = head;
      this.tail = tail;
    }
  
    // Adiciona um Temp à lista
    add(temp) {
      if (!this.head) {
        this.head = temp;
        this.tail = null;
      } else {
        this.tail = new TempList(temp, this.tail);
      }
    }
  
    // Percorre a lista
    printList() {
      let current = this;
      while (current) {
        if (current.head) {
          console.log(current.head.toString());
        }
        current = current.tail;
      }
    }
  }
  
  // Classe LabelList (lista encadeada de Label)
  class LabelList {
    constructor(head = null, tail = null) {
      this.head = head;
      this.tail = tail;
    }
  
    add(label) {
      if (!this.head) {
        this.head = label;
        this.tail = null;
      } else {
        this.tail = new LabelList(label, this.tail);
      }
    }
  
    printList() {
      let current = this;
      while (current) {
        if (current.head) {
          console.log(current.head.toString());
        }
        current = current.tail;
      }
    }
  }