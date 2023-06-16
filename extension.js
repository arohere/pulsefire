// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const axios = require('axios');
const DOMParser = require('xmldom').DOMParser;
const { exec } = require('child_process');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "pulsefire" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('pulsefire.helloWorld', async function () {
		// The code you place here will be executed every time your command is executed

		// get request to https://cerebro.icrewsystems.com/api/v1/get-all-assigned-tasks?authenticated_user=478&token=708d84e3-9b47-46ae-bb2e-95a269c689fd
		var $response = await axios.get('https://cerebro.icrewsystems.com/api/v1/get-all-assigned-tasks?authenticated_user=478&token=708d84e3-9b47-46ae-bb2e-95a269c689fd');
		// console.log($response);

		// parse xml 
		
		var $data = $response.data.map(function($row) {
			// regex for closing tags
			const reg = /<\/?[^>]+(>|$)/g;
			const regopen = /<[^>]*>/g;

			const $text = $row.description.replace(reg, '\n').replace(regopen, '').slice(0, 60).trim() + '...'; 
			console.log($text);
			return {
				label: $row.title,
				detail: $text,
				description: $row.id + ' - ' + $row.project.title,
				id: $row.id,
				// command: 'pulsefire.helloWorld'
			}
		});

		var $selected = await vscode.window.showQuickPick($data, {
			title: 'Select a task to create a branch',
			placeHolder: 'Select a task'});
		console.log($selected);

		// child process to run git checkout
		const $branchname = 'user_task_' + $selected.id;
		exec('git checkout -b ' + $branchname, (err, stdout, stderr) => {
			console.log('New Branch Created');
			console.log('Publishing Branch...');
		});
		exec('git push origin ' + $branchname, (err, stdout, stderr) => {
			if(err) {
				console.log(err);
				return;
			}
			console.log('Published Branch');
			console.log('Checking Out...')
		});
		exec('git checkout' + $branchname, (err, stdout, stderr) => {
			if(err) {
				console.log(err);
				return;
			}
			vscode.window.showInformationMessage('Checked Out to Branch ' + $branchname);
		});


	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
