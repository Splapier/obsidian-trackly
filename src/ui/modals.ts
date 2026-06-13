import { Modal, App, Setting, Notice, Component } from 'obsidian';
import type { MediaEntry, MediaType, Status } from '../types';
import { MEDIA_TYPES, STATUS_OPTIONS, MEDIA_TYPE_LABELS, HAS_PROGRESS } from '../types';

interface AddEntryModalCallbacks {
  onAdd: (entry: Omit<MediaEntry, 'id'>) => void;
}

export class AddEntryModal extends Modal {
  private callbacks: AddEntryModalCallbacks;
  private childComponent: Component;

  private selectedType: MediaType = 'games';
  private name: string = '';
  private total: number = 0;
  private status: Status = 'Not Started';
  private rating: number = 0;

  private totalInput: HTMLInputElement | null = null;
  private progressSettingEl: HTMLElement | null = null;

  constructor(app: App, callbacks: AddEntryModalCallbacks) {
    super(app);
    this.callbacks = callbacks;
    this.childComponent = new Component();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('trackly-modal');

    const title = contentEl.createEl('h2', { text: 'Add New Entry' });
    title.addClass('trackly-modal-title');

    new Setting(contentEl)
      .setName('Media Type')
      .addDropdown((dropdown) => {
        for (const type of MEDIA_TYPES) {
          dropdown.addOption(type, MEDIA_TYPE_LABELS[type]);
        }
        dropdown.setValue(this.selectedType);
        dropdown.onChange((value) => {
          this.selectedType = value as MediaType;
          this.toggleProgressField();
        });
      });

    new Setting(contentEl)
      .setName('Name')
      .addText((text) => {
        text.setPlaceholder('Enter title...');
        text.onChange((value) => {
          this.name = value;
        });
      });

    const progressSetting = new Setting(contentEl)
      .setName('Total Episodes/Chapters')
      .setDesc('For anime, manga, web novels, and TV shows')
      .addText((text) => {
        text.inputEl.type = 'number';
        text.inputEl.min = '0';
        text.setPlaceholder('0');
        this.totalInput = text.inputEl;
        text.onChange((value) => {
          this.total = parseInt(value, 10) || 0;
        });
      });
    progressSetting.settingEl.addClass('trackly-progress-setting');
    this.progressSettingEl = progressSetting.settingEl;

    this.toggleProgressField();

    new Setting(contentEl)
      .setName('Status')
      .addDropdown((dropdown) => {
        for (const status of STATUS_OPTIONS) {
          dropdown.addOption(status, status);
        }
        dropdown.setValue(this.status);
        dropdown.onChange((value) => {
          this.status = value as Status;
        });
      });

    new Setting(contentEl)
      .setName('Rating')
      .addDropdown((dropdown) => {
        dropdown.addOption('0', 'Unrated');
        for (let i = 1; i <= 5; i++) {
          dropdown.addOption(String(i), `${'\u2605'.repeat(i)}${'\u2606'.repeat(5 - i)}`);
        }
        dropdown.setValue('0');
        dropdown.onChange((value) => {
          this.rating = parseInt(value, 10) || 0;
        });
      });

    const actions = contentEl.createEl('div');
    actions.addClass('trackly-modal-actions');

    const cancelBtn = actions.createEl('button', { text: 'Cancel' });
    cancelBtn.addClass('trackly-btn');
    cancelBtn.addClass('trackly-btn-secondary');
    cancelBtn.addEventListener('click', () => this.close());

    const addBtn = actions.createEl('button', { text: 'Add Entry' });
    addBtn.addClass('trackly-btn');
    addBtn.addClass('trackly-btn-primary');
    addBtn.addEventListener('click', () => {
      if (!this.name.trim()) {
        new Notice('Please enter a name for the entry.');
        return;
      }
      let progress = 0;
      if (this.status === 'Completed' && HAS_PROGRESS[this.selectedType]) {
        progress = this.total;
      }
      this.callbacks.onAdd({
        name: this.name.trim(),
        type: this.selectedType,
        status: this.status,
        progress,
        total: this.total,
        rating: this.rating,
      });
      this.close();
    });
  }

  private toggleProgressField(): void {
    if (this.progressSettingEl) {
      if (HAS_PROGRESS[this.selectedType]) {
        if (this.totalInput) this.totalInput.disabled = false;
        this.progressSettingEl.removeClass('trackly-hidden');
      } else {
        if (this.totalInput) this.totalInput.disabled = true;
        if (this.totalInput) this.totalInput.value = '0';
        this.total = 0;
        this.progressSettingEl.addClass('trackly-hidden');
      }
    }
  }

  onClose() {
    this.childComponent.unload();
  }
}
