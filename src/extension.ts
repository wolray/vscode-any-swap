// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Lexer, Token} from './lexer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "any-swap" is now active!');

	var lexer = new Lexer();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		let editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No open text editor');
            return; // No open text editor
        }

		let selections = editor.selections;
		let content = editor.document.getText();
		let tokens = lexer.tokens(content, 0, content.length);

        if (selections.length === 2) {
            let firstRange = selections[0];
            let firstSelection = editor.document.getText(firstRange);
            if (!firstSelection.length) {
                firstRange  = <vscode.Selection> editor.document.getWordRangeAtPosition(firstRange.start);
                firstSelection = editor.document.getText(firstRange);
            }
            let secondRange = selections[1];
            let secondSelection = editor.document.getText(secondRange);
            if (!secondSelection.length) {
                secondRange  = <vscode.Selection> editor.document.getWordRangeAtPosition(secondRange.start);
                secondSelection = editor.document.getText(secondRange);
            }
            editor.edit(builder => {
                builder.replace(firstRange, secondSelection);
                builder.replace(secondRange, firstSelection);
            });
        } else {
            vscode.window.showErrorMessage('Please make two selections');
        }
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
