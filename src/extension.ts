// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Lexer, Token} from './lexer';
import { AnySwap } from './any-swap';

export function activate(context: vscode.ExtensionContext) {
	let lexer = new Lexer();
	context.subscriptions.push(vscode.commands.registerCommand('anySwap.forward', () => swap(lexer, true)));
	context.subscriptions.push(vscode.commands.registerCommand('anySwap.backward', () => swap(lexer, false)));
}

function swap(lexer: Lexer, forward: boolean) {
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	let swap = new AnySwap(editor, lexer);
	swap.runAll(forward);
}

// this method is called when your extension is deactivated
export function deactivate() {}
