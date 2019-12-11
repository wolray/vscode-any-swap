import * as vscode from 'vscode';
import { Lexer, Token } from './lexer';
import { ParseNode, Parser } from './parser';

export class AnySwap {
    readonly editor: vscode.TextEditor;
    readonly doc: vscode.TextDocument;
    readonly lexer: Lexer;

    constructor(editor: vscode.TextEditor, lexer: Lexer) {
        this.editor = editor;
        this.doc = editor.document;
        this.lexer = lexer;
    }

    private posAdd(pos: vscode.Position, diff: number): vscode.Position {
        return this.doc.positionAt(this.doc.offsetAt(pos) + diff);
    }

    private posDiff(pos1: vscode.Position, pos2: vscode.Position): number {
        return this.doc.offsetAt(pos1) - this.doc.offsetAt(pos2);
    }

    private rangeOf(origin: vscode.Position, beg: number, end: number) {
        return new vscode.Range(this.posAdd(origin, beg), this.posAdd(origin, end));
    }

    private goto(pos: vscode.Position) {
        this.editor.selection = new vscode.Selection(pos, pos);
    }

    private swap(range1: vscode.Range, range2: vscode.Range) {
        let txt1 = this.doc.getText(range1);
        let txt2 = this.doc.getText(range2);
        this.editor.edit(builder => {
            builder.replace(range1, txt2);
            builder.replace(range2, txt1);
        });
    }

    public run(selection: vscode.Selection, forward: boolean): vscode.Position | undefined {
        let pos = selection.active;
        let count = this.doc.lineCount;
        let beg = this.doc.lineAt(Math.max(0, pos.line - (forward ? 0 : 1))).range.start;
        let end = this.doc.lineAt(Math.min(count - 1, pos.line + (forward ? 1 : 0))).range.end;
        let tokens = this.lexer.tokens(this.doc.getText(new vscode.Range(beg, end)));
        let parser = new Parser(this.lexer);
        for (let t of tokens) {
            parser.add(t);
        }
        // console.log(parser.root.render());
        let target = parser.root.locate(this.posDiff(pos, beg));
        // console.log('target', target);;

        if (!target) {
            return;
        }
        let pair = forward ? target.right() : target.left();
        let lf = pair[0], rt = pair[1];
        // console.log('pair', lf, rt);
        if (lf && rt) {
            if ((lf.rule === 2) !== (rt.rule === 2)) {
                return;
            }
            let bd1 = lf.bound(), b1 = bd1[0], e1 = bd1[1];
            let bd2 = rt.bound(), b2 = bd2[0], e2 = bd2[1];
            this.swap(this.rangeOf(beg, b1, e1), this.rangeOf(beg, b2, e2));
            let after = forward ? e2 : b1;
            return this.posAdd(beg, after);
        }
        return undefined;
    }

    // todo: enable multi-cursor swap
    public runAll(forward: boolean) {
        let pos = this.run(this.editor.selection, forward);
        if (pos) {
            this.editor.selection = new vscode.Selection(pos, pos);
        }
    }
}