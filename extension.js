const vscode = require('vscode');
const axios = require('axios');
const DOMParser = require('xmldom').DOMParser;
const { exec } = require('child_process');



/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('Congratulations, your extension "pulsefire" is now active!');

	let disposable = vscode.commands.registerCommand('pulsefire.helloWorld', async function () {

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
		exec('git checkout -b ' + $branchname, {cwd: vscode.workspace.workspaceFolders[0].uri._fsPath}, (err, stdout, stderr) => {
			if(err) {
				console.log(err);
				return;
			}
			console.log(stdout);
			console.log('New Branch Created');
			console.log('Publishing Branch...');
		});
		exec('git push origin ' + $branchname, {cwd: vscode.workspace.workspaceFolders[0].uri._fsPath}, (err, stdout, stderr) => {
			if(err) {
				console.log(err);
				return;
			}
			console.log(stdout);
			console.log('Published Branch');
			console.log('Checking Out...')
		});
		exec('git checkout ' + $branchname, {cwd: vscode.workspace.workspaceFolders[0].uri._fsPath}, (err, stdout, stderr) => {
			if(err) {
				console.log(err);
				return;
			}
			console.log(stdout);
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
