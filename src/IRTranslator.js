import { Frame } from "./activationRecords";
import { TreeBuilder } from "./treePattern";

export class IRTranslator {
    constructor(mainClass, classList) {
        this.labels = new Set();
        this.frames = [];
        this.frameAtual = new Frame();
        this.mainclass = mainClass;
        this.classList = classList;
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
        Program: (program, IR) => {
            const mainClass = program.get("ClassDecl");
            mainClass.type = "MainClass";
            IR.visit(mainClass);
    
            const classDeclList = program.getAll("ClassDecl");
            classDeclList.forEach(classe => {
                IR.classeAtual = IR.classList.get(classe.valor);
                IR.visit(classe);
            });
    
            return null;
        },
    
        MainClass: (mainClass, IR) => {
            IR.classeAtual = IR.mainclass;
            const j = [false];
            IR.frameAtual = IR.frameAtual.newFrame("principal", j);
            IR.frames.push(IR.frameAtual);
    
            const mainMethod = mainClass.get("MainMethod");
    
            const structure = { EXPR: ['BODY'] };
            const operations = {
                BODY: (node) => node.children = IR.visit(mainMethod).children
            };
    
            const body = new TreeBuilder(structure, operations).build();
            const lista = [body];
            IR.frameAtual.procEntryExit1(lista);
            IR.fragmentos.push(new Frag(body, IR.frameAtual, "main"));
            IR.frames.pop();
    
            return null;
        },
    
        ClassDecl: (classDecl, IR) => {
            IR.classeAtual = IR.classList.get(classDecl.valor);
            classDecl.getAll("VarDecl").forEach(varDecl => IR.visit(varDecl));
            classDecl.getAll("MethodDecl").forEach(methodDecl => IR.visit(methodDecl));
    
            return null;
        },
    
        VarDecl: (varDecl, IR) => {
            let varEnd;
    
            if (IR.metodoAtual) {
                varEnd = IR.metodoAtual.getInParams(varDecl.valor);
                if (varEnd) {
                    varEnd.access = IR.frameAtual.allocLocal(false);
                    return null;
                }
    
                varEnd = IR.metodoAtual.getInLocals(varDecl.valor);
                if (varEnd) {
                    varEnd.access = IR.frameAtual.allocLocal(false);
                    return null;
                }
            }
    
            varEnd = IR.classeAtual.getInAtb(varDecl.valor);
            if (varEnd) {
                varEnd.access = IR.frameAtual.allocLocal(false);
            }
    
            const structure = {
                MEM: [{
                    BINOP: [
                        'PLUS',
                        'TEMP_FP',
                        'CONST_OFFSET'
                    ]
                }]
            };
    
            const operations = {
                TEMP_FP: (node) => node.children = new TEMP(IR.frameAtual.FP()).children,
                CONST_OFFSET: (node) => node.value = varEnd.access.offset
            };
    
            return new TreeBuilder(structure, operations).build();
        },
    
        MethodDecl: (methodDecl, IR) => {
            let corpo = new EXPR(new CONST(0));
            const j = [];
    
            IR.metodoAtual = IR.classeAtual.getInMethods(methodDecl.valor);
    
            methodDecl.getAll("Formal").forEach(formal => j.push(false));
    
            IR.frameAtual = IR.frameAtual.newFrame(`${IR.classeAtual.valor}$${IR.metodoAtual.valor}`, j);

            IR.frames.push(IR.frameAtual);
    
            methodDecl.getAll("Formal").forEach(formal => IR.visit(formal));
            methodDecl.getAll("VarDecl").forEach(varDecl => IR.visit(varDecl));
    
            methodDecl.getAll("Statement").forEach(stm => {

                corpo = new Node({type: "SEQ", 
                    children: [
                        corpo, 
                        new Node({type:"EXPR", children: [
                            IR.visit(stm)
                        ]})
                    ]
                });

            });
    
            const l = [corpo];
            IR.frameAtual.procEntryExit1(l);
            IR.fragmentos.push(new Frag(corpo, IR.frameAtual, IR.metodoAtual.getNome()));
            IR.metodoAtual = null;
            IR.frames.pop();
    
            return null;
        },
    
        Formal: (formal, IR) => {
            const varEnd = IR.metodoAtual.getInParams(formal.valor);
            varEnd.access = IR.frameAtual.allocLocal(false);
    
            return null;
        },
    
        Block: (block, IR) => {
            let stm = new CONST(0);
    
            const structure = {
                ESEQ: [{
                    SEQ: [{
                        EXPR: ['STM_PREV']
                    }, {
                        EXPR: ['STM_CURRENT']
                    }]
                }, 'CONST_0']
            };
    
            block.getAll("Statement").forEach(s => {
                const operations = {
                    STM_PREV: (node) => node.children = stm.children,
                    STM_CURRENT: (node) => node.children = IR.visit(s).getExp().children,
                    CONST_0: (node) => node.value = 0
                };
    
                stm = new TreeBuilder(structure, operations).build();
            });
    
            return stm;
        },
    
        If: (ifStmt, IR) => {
            const cond = IR.visit(ifStmt.get("Condition")).getExp();
            const label1 = IR.visit(ifStmt.get("Block"));
            const label2 = IR.visit(ifStmt.get("ELSE"));
    
            const structure = {
                ESEQ: [
                    { SEQ: [
                        { CJUMP: [
                            'GT',
                            'COND',
                            'CONST_0',
                            'IF_F',
                            'ELSE_E'
                        ]},
                        { SEQ: [
                            { LABEL: ['IF_F'] },
                            { SEQ: [
                                { EXPR: ['LABEL_1'] },
                                { JUMP: ['FIM'] }
                            ]}
                        ]},
                        { SEQ: [
                            { LABEL: ['ELSE_E'] },
                            { SEQ: [
                                { EXPR: ['LABEL_2'] },
                                { LABEL: ['FIM'] }
                            ]}
                        ]}
                    ]},
                    'CONST_0'
                ]
            };
    
            const operations = {
                COND: (node) => node.children = cond.children,
                CONST_0: (node) => node.value = 0,
                LABEL_1: (node) => node.children = label1.children,
                LABEL_2: (node) => node.children = label2.children
            };
    
            return new TreeBuilder(structure, operations).build();
        },
    
        While: (whileStmt, IR) => {
            const cond = IR.visit(whileStmt.get("Condition"));
            const stm  = IR.visit(whileStmt.get("Body"));
    
            const structure = {
                ESEQ: [{
                    SEQ: [{
                        SEQ: [{
                            LABEL: ['TESTE']
                        }, {
                            SEQ: [{
                                CJUMP: [
                                    'GT',
                                    'COND',
                                    'CONST_0',
                                    'CORPO',
                                    'FIM'
                                ]
                            }, {
                                SEQ: [{
                                    LABEL: ['CORPO']
                                }, {
                                    SEQ: [{
                                        EXPR: ['STM']
                                    }, {
                                        JUMP: ['TESTE']
                                    }]
                                }]
                            }]
                        }]
                    }, {
                        LABEL: ['FIM']
                    }]
                }, 'CONST_0']
            };
    
            const operations = {
                COND: (node) => node.children = cond.getExp().children,
                CONST_0: (node) => node.value = 0,
                STM: (node) => node.children = stm.getExp().children
            };
    
            return new TreeBuilder(structure, operations).build();
        },
    
        Print: (printStmt, IR) => {
            const exp = IR.visit(printStmt.get("Expression"));
            const parametros = exp.getExp();


            return IR.frameAtual.externalCall("print", parametros);
        },
    
        Assign: (assignStmt, IR) => {
            const i = IR.visit(assignStmt.get("Identifier"));
            const e = IR.visit(assignStmt.get("Expression"));
    
            const structure = {
                ESEQ: [
                    {MOVE: [
                        'EXP_I', 
                        'EXP_E'
                    ]}, 
                    'CONST_0'
                ]
            };
    
            const operations = {
                EXP_I: (node) => node.children = i.getExp().children,
                EXP_E: (node) => node.children = e.getExp().children,
                CONST_0: (node) => node.value = 0
            };
    
            return new TreeBuilder(structure, operations).build();
        }
    };
    
    

    pegarEndereco(variable) {
        let varEnd;

        if ((varEnd = this.metodoAtual.getInParams(variable.toString())) != null);
        else if ((varEnd = this.metodoAtual.getInLocals(variable.toString())) != null);
        else if ((varEnd = this.mainclass.getInAtb(variable.toString())) != null);
        else varEnd = this.classeAtual.getInAtb(variable.toString());

        return varEnd.access.exp(new TEMP(this.frameAtual.FP()));
    }
}