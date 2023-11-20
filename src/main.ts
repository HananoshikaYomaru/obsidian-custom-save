import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	TAbstractFile,
	TFile,
} from "obsidian";
import "@total-typescript/ts-reset";
import "@total-typescript/ts-reset/dom";
import { MySettingManager } from "@/SettingManager";

const isMarkdownFile = (file: TAbstractFile | null) =>
	file instanceof TFile && file.extension === "md";

export default class CustomSavePlugin extends Plugin {
	settingManager: MySettingManager;

	async onload() {
		// initialize the setting manager
		this.settingManager = new MySettingManager(this);

		// load the setting using setting manager
		await this.settingManager.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "save",
			name: "Save file",
			hotkeys: [
				{
					modifiers: ["Mod"],
					key: "s",
				},
			],
			editorCheckCallback: this.runSaveCommand.bind(this),
		});

		this.addSettingTab(new CustomSaveSettingTab(this.app, this));
	}

	runSaveCommand = async (
		checking: boolean,
		editor: Editor,
		ctx: MarkdownView
	) => {
		if (!ctx.file) return;
		if (checking) {
			return isMarkdownFile(ctx.file);
		}
		// for each command id in setting, run the command
		for (const commandId of this.settingManager.getSettings().commandIds) {
			const command = this.app.commands.findCommand(commandId);
			if (!command) {
				console.warn(`custom save :command ${commandId} not found`);
				continue;
			}
			if (command.editorCheckCallback) {
				command.editorCheckCallback(checking, editor, ctx);
				continue;
			}
			if (command.editorCallback) {
				command.editorCallback(editor, ctx);
				continue;
			}
		}

		// @ts-ignore
		this.app.workspace.getActiveFileView()?.save();
	};
}

class CustomSaveSettingTab extends PluginSettingTab {
	plugin: CustomSavePlugin;
	settingItemMap = new Map<string, Setting>();

	constructor(app: App, plugin: CustomSavePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// get the setting using setting manager
		const setting = this.plugin.settingManager.getSettings();

		let currentValue = "";

		new Setting(containerEl)
			.setName("Add command")
			.addDropdown((dropdown) => {
				dropdown.addOptions(
					this.plugin.app.commands
						.listCommands()
						// filter out the commands that are already in the setting
						.filter(
							(command) =>
								!setting.commandIds.includes(command.id) &&
								(command.editorCallback ||
									command.editorCheckCallback)
						)

						.map((command) => {
							return {
								label: command.name,
								value: command.id,
							};
						})
						.reduce(
							(acc, cur) => {
								acc[cur.value] = cur.label;
								return acc;
							},
							{
								"": "",
							} as Record<string, string>
						)
				);
				dropdown.onChange(async (value) => {
					currentValue = value;
				});
			})
			.addButton((button) => {
				button.setButtonText("Add").onClick(() => {
					if (!currentValue) return;
					this.plugin.settingManager.updateSettings((setting) => {
						setting.value.commandIds.push(currentValue);
					});
					// do it again
					containerEl.empty();
					this.display();
					// // create an setting item for the new command
					// const setting = new Setting(containerEl)
					// 	.setName(currentValue)
					// 	.addButton((button) => {
					// 		button.setButtonText("Remove").onClick(() => {
					// 			this.plugin.settingManager.updateSettings(
					// 				(setting) => {
					// 					setting.value.commandIds =
					// 						setting.value.commandIds.filter(
					// 							(id) => id !== currentValue
					// 						);
					// 				}
					// 			);
					// 		});
					// 	});
					// this.settingItemMap.set(currentValue, setting);
				});
			});

		// for each setting
		setting.commandIds.forEach((commandId) => {
			// try to get the command
			const command = this.plugin.app.commands.findCommand(commandId);
			const setting = new Setting(containerEl)
				.setName(`${commandId} ${!command ? "(not found)" : ""}`)
				.addButton((button) => {
					button.setButtonText("Remove").onClick(() => {
						this.plugin.settingManager.updateSettings((setting) => {
							setting.value.commandIds =
								setting.value.commandIds.filter(
									(id) => id !== commandId
								);
						});

						// get the item from the map
						// const item = this.settingItemMap.get(commandId);
						// item?.controlEl.remove();

						// do it again
						containerEl.empty();
						this.display();
					});
				});

			if (!command) setting.nameEl.addClass("custom-save-error");
			this.settingItemMap.set(commandId, setting);
		});
	}
}
