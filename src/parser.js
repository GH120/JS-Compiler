import { Language } from "./language.js";

export class Parser{

    constructor(settings = {
        language: null,
    }){

        this.settings = settings;

        this.language = new Language(
            ["NUM", "REAL", "ID"],
            [""]
        )
    }
    
    parse(tokens){

    }
}