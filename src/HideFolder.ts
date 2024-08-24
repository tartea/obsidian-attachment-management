import { setIcon } from "obsidian";

import AttachmentManagementPlugin from "./main";
import { AttachmentManagementPluginSettings } from "./settings/settings";
import { SETTINGS_VARIABLES_NOTENAME } from "./lib/constant";

export class HideFolder {
  plugin: AttachmentManagementPlugin
  ribbonIconButton: HTMLElement;
  statusBarItem: HTMLElement;
  mutationObserver: MutationObserver;

  constructor(plugin: AttachmentManagementPlugin) {
    this.plugin = plugin;
  }

  load() {
    // This creates an icon in the left ribbon.
    this.ribbonIconButton = this.plugin.addRibbonIcon(
      this.plugin.settings.autoHideAttachment ? "eye-off" : "eye",
      "切换附件文件夹的“显示/隐藏",
      async (evt: MouseEvent) => {
        this.plugin.settings.autoHideAttachment = !this.plugin.settings.autoHideAttachment;
        await this.plugin.saveSettings();
        this.refresh();
      }
    );

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    this.statusBarItem = this.plugin.addStatusBarItem();
    this.statusBarItem.setText(this.plugin.settings.autoHideAttachment ? "附件文件夹已隐藏" : "");

    this.mutationObserver = new MutationObserver((mutationRecord) => {
      mutationRecord.forEach(record => {
        if (record.target?.parentElement?.classList.contains("nav-folder")) {
          this.refreshFolders();
        }
      });
    });
    this.mutationObserver.observe(window.document, { childList: true, subtree: true });
  }

  async refresh() {
    setIcon(this.ribbonIconButton, this.plugin.settings.autoHideAttachment ? "eye-off" : "eye");
    this.statusBarItem.setText(this.plugin.settings.autoHideAttachment ? "附件文件夹已隐藏" : "");
    await this.refreshFolders();
  }

  async refreshFolders() {
    const filter = this.buildFolderRegExp(this.plugin.settings);

    const folders = document.querySelectorAll(".nav-folder-title-content");

    folders.forEach((folder) => {
      const folderName = folder.innerHTML;
      if (filter.test(folderName)) {
        if (this.plugin.settings.autoHideAttachment) {
          folder.parentElement?.parentElement?.addClass("hide-attachment-folder");
        } else {
          folder.parentElement?.parentElement?.removeClass("hide-attachment-folder");
        }
        if (this.plugin.settings.autoHideAttachment) {
          folder.parentElement?.parentElement?.addClass("aero-attachment-folder");
        } else {
          folder.parentElement?.parentElement?.removeClass("aero-attachment-folder");
        }
      }
    })
  }

  unload() {
    this.mutationObserver.disconnect();
  }

  buildFolderRegExp(settings: AttachmentManagementPluginSettings) {
    let reg = this.encode(settings.attachPath.attachmentPath);
    // 兼容 notename
    // https://github.com/chenfeicqq/obsidian-attachment-manager/issues/11
    reg = reg.replace(this.encode(SETTINGS_VARIABLES_NOTENAME), ".+");
    return new RegExp("^" + reg + "$");
  }
  encode(text: string) {
    // 特殊字符
    const specialCharacters = ["\\$", "\\[", "\\]", "\\{", "\\}", "\\(", "\\)", "\\*", "\\+", "\\.", "\\?", "\\\\", "\\^"];
    // 特殊字符的匹配正则
    const reg = new RegExp("[" + specialCharacters.join("") + "]", 'gi');
    // 对特殊字符进行转义
    return text.replace(reg, (character: string) => `\\${character}`);
  }
}