import { Language } from "./language.js";
import util from 'util'

export class Parser{

    constructor(settings = {
        language: null,
    }){

        this.settings = settings;
    }
    
    parse(tokens){
        this.tokens = tokens.map(t => t).reverse();

        this.token = this.getToken();

        this.S();

    }

    getToken(){
        return this.tokens.pop();
    }
}

export class PredictiveParser extends Parser{

    constructor(settings={
        language:null
    }){
        super(settings);

        this.node = {};

        this.syntaxTree = {Start: this.node};

    }

    advance(){

        this.token = this.getToken();

        console.log(util.inspect(this.syntaxTree, {depth: 10, colors: true}))
    }

    eat(token){

        if(this.token.type == token) {
            this.advance();
            this.node[token] = token;
        }

        else throw Error("Token esperado: " + this.token.type + "; Token recebido " + token);
    }

    S(){
        const node = this.node;

        this.addNode("S");

        switch(this.token.type){

            case "ID": this.eat("ID"); this.eat("ASSIGN"); this.E(); this.L(); break;
            case "BEGIN": this.eat("BEGIN"); this.S(); this.L(); break;
            case "PRINT": this.eat("PRINT"); this.eat("LPAR"); this.E(); this.eat("RPAR"); break;
            default: throw Error("Token não identificado " + this.token.type);
        }

        this.node = node;
    }

    L(){

        const node = this.node;

        this.addNode("L");

        switch(this.token.type){

            case "END": this.eat("END"); break;
            case "SEMI": this.eat("SEMI"); this.S(); this.L(); break;
            default: throw Error("Token não identificado" + this.token.type);
        }

        this.node = node;
    }

    E(){

        const node = this.node;

        this.addNode("E");

        this.eat("ID");

        while(true){

            const tokens = [this.tokens[0], this.tokens[1]]

            try{
                this.eat("PLUS");
                this.eat("ID");
            }
            catch(e){

                this.tokens.concat(tokens)
                break;
            }

        }

        this.node = node;
    }

    addNode(type){

        this.node[type] = {};

        this.node = this.node[type];
    }
}