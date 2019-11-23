const MAX = 64;
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
        this.register([':', '=>', '->'], 3);
        const _assign = this.register(['\\+=', '-=', '\\*=', '%=', '&=', '\\|=', '^='], 3);
        const _condition = this.register([], 1);
        const _or = this.register(['\\|\\|'], 3);
        const _and = this.register(['&&'], 3);
        const _not = this.register(['!'], 1);
        this.register(['===', '!==', '==', '!=', '~='], 3);
        this.register(['='], ..._assign);
        const _compare = this.register(['<=', '>='], 3);
        this.register(['&', '\\|', '\\^'], 3);
        this.register(['\\+', '-'], 3);
        this.register(['\\*', '/', '%'], 3);
        this.regexes = this.regexes.concat(['"[^"]*?"', "'[^']*?'", `<${WORD}*?>`]);
        this.register(['<', '>'], ..._compare);
        this.regexes.push(`${WORD}+`);
        this.register(['return'], ..._return);
        this.register(['or'], ..._or);
        this.register(['and'], ..._and);
        this.register(['not'], ..._not);
        this.register(['while', 'if', 'elif'], ..._condition);
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

    public tokens(content: string): Token[] {
        let res: Token[] = [];
        let match;
        while (match = this.full_reg.exec(content)) {
            let txt = match[0];
            let beg = match.index, end = beg + txt.length;
            let prior = this.prior_dict.get(txt);
            if (prior === undefined) {
                prior = MAX;
            }
            let rule = this.rule_dict.get(txt);
            if (rule === undefined) {
                rule = 0;
            }
            let token = new Token(txt, prior, rule);
            token.setRegion(beg, end);
            res.push(token);
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