import { TreeBuilder } from "./treePattern";

class IRTranslator {
    constructor() {
        this.labels = new Set();
        this.frames = [];
        this.frameAtual = null;
        this.mainclass = null;
        this.classList = new Map();
        this.metodoAtual = null;
        this.classeAtual = null;
        this.fragmentos = [];
        this.classeCallStack = null;
        this.metodoCallStack = null;
    }

    visit(node) {
        return this.visitNode[node.type](node, this);
    }

    visitNode = {
        Program: (node, irTranslator) => {
            irTranslator.visit(node.m);

            node.cl.forEach(classe => {
                irTranslator.classeAtual = irTranslator.classList.get(classe.toString());
                irTranslator.visit(classe);
            });

            return null;
        },

        MainClass: (node, irTranslator) => {
            irTranslator.classeAtual = irTranslator.mainclass;

            const j = [false];
            irTranslator.frameAtual = irTranslator.frameAtual.newFrame("principal", j);
            irTranslator.frames.push(irTranslator.frameAtual);

            const body = new EXPR(irTranslator.visit(node.s).getExp());
            const lista = [body];

            irTranslator.frameAtual.procEntryExit1(lista);
            irTranslator.fragmentos.push(new Frag(body, irTranslator.frameAtual, "main"));
            irTranslator.frames.pop();

            return null;
        },

        ClassDeclSimple: (node, irTranslator) => {
            irTranslator.classeAtual = irTranslator.classList.get(node.i.toString());
            node.vl.forEach(varDecl => irTranslator.visit(varDecl));
            node.ml.forEach(methodDecl => irTranslator.visit(methodDecl));

            return null;
        },

        ClassDeclExtends: (node, irTranslator) => {
            irTranslator.classeAtual = irTranslator.classList.get(node.i.toString());
            node.vl.forEach(varDecl => irTranslator.visit(varDecl));
            node.ml.forEach(methodDecl => irTranslator.visit(methodDecl));

            return null;
        },

        VarDecl: (node, irTranslator) => {
            let varEnd;

            if (irTranslator.metodoAtual) {
                varEnd = irTranslator.metodoAtual.getInParams(node.i.toString());

                if (varEnd) {
                    varEnd.access = irTranslator.frameAtual.allocLocal(false);
                    return null;
                }

                varEnd = irTranslator.metodoAtual.getInLocals(node.i.toString());

                if (varEnd) {
                    varEnd.access = irTranslator.frameAtual.allocLocal(false);
                    return null;
                }
            }

            varEnd = irTranslator.classeAtual.getInAtb(node.i.toString());

            if (varEnd) {
                varEnd.access = irTranslator.frameAtual.allocLocal(false);
            }

            return new ExpEnc(varEnd.access.exp(new TEMP(irTranslator.frameAtual.FP())));
        },

        MethodDecl: (node, irTranslator) => {
            let corpo = new EXPR(new CONST(0));
            const j = [];

            irTranslator.metodoAtual = irTranslator.classeAtual.getInMethods(node.i.toString());

            for (let i = 0; i <= node.fl.size(); i++) {
                j.push(false);
            }

            irTranslator.frameAtual = irTranslator.frameAtual.newFrame(`${irTranslator.classeAtual.toString()}$${irTranslator.metodoAtual.toString()}`, j);
            irTranslator.frames.push(irTranslator.frameAtual);

            node.fl.forEach(formal => irTranslator.visit(formal));
            node.vl.forEach(varDecl => irTranslator.visit(varDecl));

            node.sl.forEach(stm => {
                corpo = new SEQ(corpo, new EXPR(irTranslator.visit(stm).getExp()));
            });

            const l = [corpo];
            irTranslator.frameAtual.procEntryExit1(l);
            irTranslator.fragmentos.push(new Frag(corpo, irTranslator.frameAtual, irTranslator.metodoAtual.getNome()));
            irTranslator.metodoAtual = null;
            irTranslator.frames.pop();

            return null;
        },

        Formal: (node, irTranslator) => {
            const varEnd = irTranslator.metodoAtual.getInParams(node.i.toString());
            varEnd.access = irTranslator.frameAtual.allocLocal(false);

            return null;
        },

        Block: (node, irTranslator) => {
            let stm = new CONST(0);
            node.sl.forEach(s => {
                stm = new ESEQ(new SEQ(new EXPR(stm), new EXPR(irTranslator.visit(s).getExp())), new CONST(0));
            });

            return new ExpEnc(stm);
        },

        If: (node, irTranslator) => {
            const cond = irTranslator.visit(node.e).getExp();
            const label1 = irTranslator.visit(node.s1);
            const label2 = irTranslator.visit(node.s2);
        
            const structure = {
                ESEQ: [
                    {SEQ: [
                        {CJUMP: [
                            'GT',
                            'COND',
                            'CONST_0',
                            'IF_F',
                            'ELSE_E'
                        ]},
                        {SEQ: [
                            {LABEL: ['IF_F']},
                            {SEQ: [
                                {EXPR: ['LABEL_1']},
                                {JUMP: ['FIM']}
                            ]}
                        ]},
                        {SEQ: [
                            {LABEL: ['ELSE_E']},
                            {SEQ: [
                                {EXPR: ['LABEL_2']},
                                {LABEL: ['FIM']}
                            ]}
                        ]}
                    ]},
                    'CONST_0'
                ]
            };
            
            const operations = {
                COND: (node) => node.children = cond.children,
                CONST_0: (node) => node.value = 0,
                LABEL_1: (node) => node.children = label1.getExp().children,
                LABEL_2: (node) => node.children = label2.getExp().children
            };
            
            return new TreeBuilder(structure, operations).build();
        },

        While: (node, irTranslator) => {
            const teste = new Label();
            const corpo = new Label();
            const fim = new Label();

            const cond = irTranslator.visit(node.e);
            const stm = irTranslator.visit(node.s);

            return new ExpEnc(new ESEQ(new SEQ(new SEQ(new LABEL(teste), new SEQ(new CJUMP(CJUMP.GT, cond.getExp(), new CONST(0), corpo, fim), new SEQ(new LABEL(corpo), new SEQ(new EXPR(stm.getExp()), new JUMP(teste)))), new LABEL(fim)), new CONST(0)));
        },

        Print: (node, irTranslator) => {
            const exp = irTranslator.visit(node.e);
            const parametros = new Tree.ExpList(exp.getExp(), null);

            return new ExpEnc(irTranslator.frameAtual.externalCall("print", Converter.ExpListToList(parametros)));
        },

        Assign: (node, irTranslator) => {
            const i = irTranslator.visit(node.i);
            const e = irTranslator.visit(node.e);
        
            const structure = {
                ESEQ: [
                    {
                        MOVE: [
                            'EXP_I',
                            'EXP_E'
                        ]
                    },
                    'CONST_0'
                ]
            };
        
            const operations = {
                EXP_I: (node) => node.children = i.getExp().children,
                EXP_E: (node) => node.children = e.getExp().children,
                CONST_0: (node) => node.value = 0
            };
        
            return new ExpEnc(new TreeBuilder(structure, operations).build());
        },

        ArrayAssign: (node, irTranslator) => {
            const i = irTranslator.visit(node.i);
            const e1 = irTranslator.visit(node.e1);
            const e2 = irTranslator.visit(node.e2);

            return new ExpEnc(new ESEQ(new MOVE(new MEM(new BINOP(BINOP.PLUS, i.getExp(), new BINOP(BINOP.MUL, e1.getExp(), new CONST(irTranslator.frameAtual.wordSize())))), e2.getExp()), new CONST(0)));
        },

        And: (node, irTranslator) => {
            const e1 = irTranslator.visit(node.e1);
            const e2 = irTranslator.visit(node.e2);

            return new ExpEnc(new BINOP(BINOP.AND, e1.getExp(), e2.getExp()));
        },

        LessThan: (node, irTranslator) => {
            const e1 = irTranslator.visit(node.e1);
            const e2 = irTranslator.visit(node.e2);

            return new ExpEnc(new BINOP(BINOP.MINUS, e2.getExp(), e1.getExp()));
        },

        Plus: (node, irTranslator) => {
            const e1 = irTranslator.visit(node.e1);
            const e2 = irTranslator.visit(node.e2);
        
            const structure = {
                BINOP: [
                    'PLUS',
                    'EXP_1',
                    'EXP_2'
                ]
            };
        
            const operations = {
                EXP_1: (node) => node.children = e1.getExp().children,
                EXP_2: (node) => node.children = e2.getExp().children
            };
        
            return new TreeBuilder(structure, operations).build();
        },

        Minus: (node, irTranslator) => {
            const e1 = irTranslator.visit(node.e1);
            const e2 = irTranslator.visit(node.e2);

            return new ExpEnc(new BINOP(BINOP.MINUS, e1.getExp(), e2.getExp()));
        },

        Times: (node, irTranslator) => {
            const e1 = irTranslator.visit(node.e1);
            const e2 = irTranslator.visit(node.e2);

            return new ExpEnc(new BINOP(BINOP.MUL, e1.getExp(), e2.getExp()));
        },

        ArrayLookup: (node, irTranslator) => {
            const e1 = irTranslator.visit(node.e1);
            const e2 = irTranslator.visit(node.e2);

            return new ExpEnc(new MEM(new BINOP(BINOP.PLUS, e1.getExp(), new BINOP(BINOP.MUL, new BINOP(BINOP.PLUS, new CONST(1), e2.getExp()), new CONST(irTranslator.frameAtual.wordSize()))));
        },

        ArrayLength: (node, irTranslator) => {
            return new ExpEnc(new MEM(irTranslator.pegarEndereco(Symbol.symbol(((IdentifierExp) node.e).s)).getExp()));
        },

        Call: (node, irTranslator) => {
            let j = null;
            let lista = null;

            for (let i = node.el.length - 1; i >= 0; i--) {
                lista = new Tree.ExpList(irTranslator.visit(node.el[i]).getExp(), lista);
            }

            lista = new Tree.ExpList(irTranslator.visit(node.e).getExp(), lista);

            if (node.e.type === "This") {
                j = irTranslator.classeAtual;
            }

            if (node.e.type === "NewObject") {
                j = irTranslator.classList.get(Symbol.symbol(node.e.toString()));
            }

            if (node.e.type === "IdentifierExp") {
                let varEnd = irTranslator.metodoAtual.getInParams(node.e.toString());
                if (!varEnd) varEnd = irTranslator.metodoAtual.getInLocals(node.e.toString());

                if (!varEnd) {
                    j = irTranslator.classeAtual;
                } else {
                    j = irTranslator.classList.get(Symbol.symbol(varEnd.getNome()));
                }
            }

            if (node.e.type === "Call") {
                const tipoRetorno = irTranslator.metodoCallStack.getTipo();

                for (const [key, value] of irTranslator.classList.entries()) {
                    if (value.getNome() === tipoRetorno) {
                        j = value;
                        break;
                    }
                }
            }

            irTranslator.classeCallStack = j;
            irTranslator.metodoCallStack = j.getInMethods(node.i.toString());
            return new ExpEnc(new CALL(new NAME(new Label(`${j.getNome()}$${node.i.toString()}`), lista));
        },

        IntegerLiteral: (node, irTranslator) => {
            return new ExpEnc(new CONST(node.i));
        },

        True: (node, irTranslator) => {
            return new ExpEnc(new CONST(1));
        },

        False: (node, irTranslator) => {
            return new ExpEnc(new CONST(0));
        },

        IdentifierExp: (node, irTranslator) => {
            return irTranslator.pegarEndereco(Symbol.symbol(node.s));
        },

        This: (node, irTranslator) => {
            return new ExpEnc(new MEM(new TEMP(irTranslator.frameAtual.FP())));
        },

        NewArray: (node, irTranslator) => {
            const tam = irTranslator.visit(node.e);
            const aloc = new BINOP(BINOP.MUL, new BINOP(BINOP.PLUS, tam.getExp(), new CONST(1)), new CONST(irTranslator.frameAtual.wordSize()));
            const parametros = new Tree.ExpList(aloc, null);
            const listaConvertida = Converter.ExpListToList(parametros);
            const retorno = irTranslator.frameAtual.externalCall("initArray", listaConvertida);

            return new ExpEnc(retorno);
        },

        NewObject: (node, irTranslator) => {
            const j = irTranslator.classList.get(Symbol.symbol(node.i.toString()));
            const tam = j.getAtributos().length;

            const parametros = new Tree.ExpList(new BINOP(BINOP.MUL, new CONST(1 + tam), new CONST(irTranslator.frameAtual.wordSize())), null);
            const lista = Converter.ExpListToList(parametros);
            return new ExpEnc(irTranslator.frameAtual.externalCall("malloc", lista));
        },

        Not: (node, irTranslator) => {
            const e = irTranslator.visit(node.e);
            return new ExpEnc(new BINOP(BINOP.MINUS, new CONST(1), e.getExp()));
        },

        Identifier: (node, irTranslator) => {
            return irTranslator.pegarEndereco(Symbol.symbol(node.s));
        }
    };

    pegarEndereco(variable) {
        let varEnd;

        if ((varEnd = this.metodoAtual.getInParams(variable.toString())) != null);
        else if ((varEnd = this.metodoAtual.getInLocals(variable.toString())) != null);
        else if ((varEnd = this.mainclass.getInAtb(variable.toString())) != null);
        else varEnd = this.classeAtual.getInAtb(variable.toString());

        return new ExpEnc(varEnd.access.exp(new TEMP(this.frameAtual.FP())));
    }
}