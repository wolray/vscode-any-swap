const MAX = 32;
const WORD = '[0-9a-zA-Z_\\.~@$]';

export class Lexer {
    private regexes: string[] = [];
    private prior = 0;
    readonly prior_dict: Map<string, number> = new Map();
    readonly rule_dict: Map<string, number> = new Map();
    private full_reg: RegExp;
    readonly pair_dict: Map<string, string> = new Map();

    constructor() {
        this.register(['{', '\\[', '\\('], 1);
        this.register(['\\)', '\\]', '}'], 2);
        this.register([';'], 2);
        this.register(['\n'], 3);
        const _return = this.register([], 1);
        this.register([','], 3);
        this.register([':', '=>', '<='], 3);
        const _assign = this.register(['\\+=', '-=', '\\*=', '%=', '&=', '\\|=', '^='], 3);
        const _condition = this.register([], 1);
        const _or = this.register(['\\|\\|'], 3);
        const _and = this.register(['&&'], 3);
        const _not = this.register(['!'], 1);
        this.register(['==', '!=', '~='], 3);
        this.register(['='], _assign[0], _assign[1]);
        const _compare = this.register(['<=', '>='], 3);
        this.register(['&', '\\|', '\\^'], 3);
        this.register(['\\+', '-'], 3);
        this.register(['\\*', '/', '%'], 3);
        this.regexes = this.regexes.concat(['"[^"]*?"', "'[^']*?'", `<${WORD}*?>`]);
        this.register(['<', '>'], _compare[0], _compare[1]);
        this.regexes.push(`${WORD}+`);
        this.register(['return'], _return[0], _return[1]);
        this.register(['or'], _or[0], _or[1]);
        this.register(['and'], _and[0], _and[1]);
        this.register(['not'], _not[0], _not[1]);
        this.register(['while', 'if', 'elif'], _condition[0], _condition[1]);
        this.full_reg = new RegExp(this.regexes.join('|'), 'g');
        this.pair_dict.set('(', ')');
        this.pair_dict.set('[', ']');
        this.pair_dict.set('{', '}');
    }

    private register(ls: string[], rule: number, prior?: number | undefined): [number, number]  {
        this.regexes = this.regexes.concat(ls);
        if (prior === undefined) {
            prior = this.prior;
            this.prior += 1;
        }
        for (let c of ls) {
            let txt = c.replace('\\', '');
            this.rule_dict.set(txt, rule);
            this.prior_dict.set(txt, prior);
        }
        return [rule, prior];
    }

    public tokens(content: string, beg: number, end: number): Token[] {
        let curr = beg;
        let res: Token[] = [];
        let match;
        while (match = this.full_reg.exec(content)) {
            let txt = match[0];
            let beg = match.index, end = beg + txt.length;
            let token = new Token(txt, this.prior_dict.get(txt) || MAX, this.rule_dict.get(txt) || 0);
            token.setRegion(beg, end);
            if (curr <= end) {
                res.push(token);
            }
        }
        return res;
    }
}

export class Token {
    readonly txt: string;
    readonly prior: number;
    readonly rule: number;
    beg: number = 0;
    end: number = 0;
    
    constructor(txt: string, prior: number, rule: number) {
        this.txt = txt;
        this.prior = prior;
        this.rule = rule;
    }

    public setRegion(beg: number, end: number) {
        this.beg = beg;
        this.end = end;
    }

    public toString(): string {
        return this.txt === '\n' ? '\\n' : this.txt;
    }

    public length(): number {
        return this.end - this.beg;
    }
}