import { Token, Lexer } from './lexer';
import { threadId } from 'worker_threads';

export class ParseNode {
    tokens: Token[];
    parent: ParseNode | undefined = undefined;
    subNodes: ParseNode[] = [];
    index: number = 0;
    prior: number;
    rule: number;
    beg: number;
    end: number;

    constructor(token: Token) {
        this.tokens = [token];
        this.prior = token.prior;
        this.rule = token.rule;
        this.beg = token.beg;
        this.end = token.end;
    }

    public toString(): string {
        return this.tokens.map(t => t.toString()).join('');
    }

    public sub(index: number): ParseNode | undefined {
        return this.subNodes.length > index ? this.subNodes[index] : undefined;
    }

    public cmp(node: ParseNode): number {
        return this.prior - node.prior;
    }

    public add(node: ParseNode) {
        node.parent = this;
        node.index = this.subNodes.length;
        this.subNodes.push(node);
    }

    public insert(node: ParseNode) {
        let last = this.pop();
        this.add(node);
        if (last) {
            node.add(last);
        }
    }

    public merge(node: ParseNode) {
        this.tokens.push(...node.tokens);
        this.prior = node.prior;
        this.rule = node.rule & 1;
        this.end = node.end;
    }

    public pop(): ParseNode | undefined {
        return this.subNodes.length > 0 ? this.subNodes.pop() : undefined;
    }

    public bound(): [number, number] {
        if (this.subNodes.length === 0) {
            return [this.beg, this.end];
        }
        let beg = Math.min(this.beg, this.subNodes[0].bound()[0]);
        let end = Math.max(this.end, this.subNodes[this.subNodes.length - 1].bound()[1]);
        return [beg, end];
    }

    public getPrev(): ParseNode | undefined {
        if (this.index > 0 && this.parent) {
            return this.parent.sub(this.index - 1);
        }
        return undefined;
    }

    public getNext(): ParseNode | undefined {
        if (this.parent && this.index < this.parent.subNodes.length - 1) {
            return this.parent.sub(this.index + 1);
        }
        return undefined;
    }

    public left(): [ParseNode | undefined, ParseNode | undefined] {
        // console.log('left', this.parent, this.index);
        if (!this.parent) {
            return [undefined, this];
        }
        let left = this.getPrev();
        if (left) {
            if (left.cmp(this.parent) === 0 && this.parent.rule === 3) {
                left = left.sub(left.subNodes.length - 1);
            }
            return [left, this];
        }
        return this.parent.left();
    }

    public right(): [ParseNode | undefined, ParseNode | undefined] {
        // console.log('right', this.parent, this.index);
        if (!this.parent) {
            return [this, undefined];
        }
        let right = this.getNext();
        if (right) {
            return [this, right];
        }
        let res = this.parent.right();
        if (this.parent.parent && this.parent.rule === 3) {
            if (this.parent.cmp(this.parent.parent) === 0) {
                return [this, res[1]];
            }
        }
        return res;
    }

    public locate(pos: number): ParseNode | undefined {
        let res = undefined;
        if (this.parent && this.beg <= pos && pos <= this.end) {
            res = this;
        }
        if (this.subNodes.length === 0) {
            return res;
        }
        for (let n of this.subNodes) {
            let found = n.locate(pos);
            if (found) {
                res = found;
            }
        }
        return res;
    }

    public render(): string {
        return this.printTo([], [], []);
    }

    public printTo(res: string[], p1: string[], p2: string[]): string {
        res.push(...p1, this.toString(), '\n');
        let n = this.subNodes.length;
        let i = 0;
        for (let child of this.subNodes) {
            if (i < n - 1) {
                child.printTo(res, p2.concat(['├─']), p2.concat(['│ ']));
            } else {
                child.printTo(res, p2.concat(['└─']), p2.concat(['  ']));
            }
            i++;
        }
        return res.join('');
    }
}

export class Parser {
    readonly lexer: Lexer;
    readonly root: ParseNode = new ParseNode(new Token('?', -1, -1));
    readonly wait: [string, ParseNode][] = [];
    private curr: ParseNode;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.curr = this.root;
    }

    public add(token: Token) {
        let next = new ParseNode(token);
        // console.log('add ', this.curr, token);
        if (token.rule === 0) {
            this.add0(next);
        } else if (token.rule === 1) {
            this.add1(next);
        } else if (token.rule === 2) {
            this.add2(next);
        } else if (token.rule === 3) {
            this.add3(next);
        }
    }

    public add0(node: ParseNode) {
        if (this.curr.rule === 0) {
            this.curr.merge(node);
        } else {
            if ((this.curr.rule & 1) === 0 && this.curr.parent) {
                this.curr = this.curr.parent;
            }
            this.curr.add(node);
            this.curr = node;
        }
    }

    public add1(node: ParseNode) {
        this.add0(node);
        let txt = node.tokens[0].txt;
        let back = this.lexer.pairMap.get(txt);
        if (back) {
            this.wait.push([back, this.curr]);
        }
    }

    public add2(node: ParseNode) {
        if (this.wait.length > 0) {
            let txt = node.tokens[0].txt;
            let recent = this.wait[this.wait.length - 1];
            if (txt === recent[0]) {
                this.curr = recent[1];
                this.curr.merge(node);
                this.wait.pop();
                return;
            }
        }
        this.add3(node);
    }

    public add3(node: ParseNode) {
        if (node.tokens[0].txt === '\n' && this.curr.rule > 0) {
            return;
        }
        if ((this.curr.rule & 1) === 0 && this.curr.parent) {
            this.curr = this.curr.parent;
        }
        while (this.curr.cmp(node) >= 0 && this.curr.parent) {
            this.curr = this.curr.parent;
        }
        this.curr.insert(node);
        this.curr = node;
    }
}
