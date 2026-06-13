import { Component } from 'obsidian';
import type { MediaEntry, Status } from '../types';
import { MEDIA_TYPES, MEDIA_TYPE_LABELS, HAS_PROGRESS, MEDIA_TYPE_COLORS } from '../types';
import type { StorageManager } from '../storage/manager';

interface DashboardCallbacks {
  onIncrement: (entry: MediaEntry, amount: number) => void;
  onStatusChange: (entry: MediaEntry, status: Status) => void;
  onRatingChange: (entry: MediaEntry, rating: number) => void;
  onSuggestClick: () => void;
}

export class DashboardView extends Component {
  private storage: StorageManager;
  private callbacks: DashboardCallbacks;
  private container: HTMLElement;

  private allEntries: MediaEntry[] = [];
  private suggestedEntry: MediaEntry | null = null;

  constructor(container: HTMLElement, storage: StorageManager, callbacks: DashboardCallbacks) {
    super();
    this.container = container;
    this.storage = storage;
    this.callbacks = callbacks;
  }

  async load(): Promise<void> {
    this.allEntries = await this.storage.getAllEntries();
    this.suggestedEntry = this.getRandomNotStarted();
    this.render();
  }

  private getRandomNotStarted(): MediaEntry | null {
    const notStarted = this.allEntries.filter((e) => e.status === 'Not Started');
    if (notStarted.length === 0) return null;
    const picked = notStarted[Math.floor(Math.random() * notStarted.length)];
    return picked ?? null;
  }

  private render(): void {
    this.container.empty();
    this.renderSummary();
    this.renderActiveItems();
    this.renderSuggestion();
  }

  private renderSummary(): void {
    const header = this.container.createEl('h2', { text: 'Overview' });
    header.addClass('trackly-section-header');

    const summaryContainer = this.container.createEl('div');
    summaryContainer.addClass('trackly-summary-grid');

    for (const type of MEDIA_TYPES) {
      const entries = this.allEntries.filter((e) => e.type === type);
      if (entries.length === 0) continue;

      const completed = entries.filter((e) => e.status === 'Completed').length;
      const total = entries.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const typeColor = MEDIA_TYPE_COLORS[type];

      const card = summaryContainer.createEl('div');
      card.addClass('trackly-summary-card');
      card.style.borderLeftColor = typeColor;

      const label = card.createEl('div', { text: MEDIA_TYPE_LABELS[type] });
      label.addClass('trackly-summary-label');
      label.style.color = typeColor;

      const barContainer = card.createEl('div');
      barContainer.addClass('trackly-progress-bar-bg');

      const barFill = barContainer.createEl('div');
      barFill.addClass('trackly-progress-bar-fill');
      barFill.style.width = `${percentage}%`;
      barFill.style.background = `linear-gradient(90deg, ${this.darkenColor(typeColor, 0.4)}, ${typeColor})`;

      const counter = card.createEl('div', {
        text: `${completed} / ${total} completed (${percentage}%)`,
      });
      counter.addClass('trackly-summary-counter');
    }
  }

  private darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private renderActiveItems(): void {
    const activeEntries = this.allEntries.filter((e) => e.status === 'Started');

    const header = this.container.createEl('h2', { text: 'Currently Active' });
    header.addClass('trackly-section-header');

    if (activeEntries.length === 0) {
      const empty = this.container.createEl('p', { text: 'No active items. Start something new!' });
      empty.addClass('trackly-empty-state');
      return;
    }

    const list = this.container.createEl('div');
    list.addClass('trackly-active-list');

    for (const entry of activeEntries) {
      const typeColor = MEDIA_TYPE_COLORS[entry.type];

      const item = list.createEl('div');
      item.addClass('trackly-active-item');
      item.style.borderLeftColor = typeColor;

      const infoSection = item.createEl('div');
      infoSection.addClass('trackly-active-info');

      const typeBadge = infoSection.createEl('span', { text: MEDIA_TYPE_LABELS[entry.type] });
      typeBadge.addClass('trackly-type-badge');
      typeBadge.style.background = typeColor;

      const nameEl = infoSection.createEl('span', { text: entry.name });
      nameEl.addClass('trackly-active-name');

      const controlsSection = item.createEl('div');
      controlsSection.addClass('trackly-active-controls');

      if (HAS_PROGRESS[entry.type]) {
        const progressPercent = entry.total > 0 ? Math.round((entry.progress / entry.total) * 100) : 0;

        const progressMiniBar = controlsSection.createEl('div');
        progressMiniBar.addClass('trackly-mini-progress-bg');

        const progressMiniFill = progressMiniBar.createEl('div');
        progressMiniFill.addClass('trackly-mini-progress-fill');
        progressMiniFill.style.width = `${progressPercent}%`;
        progressMiniFill.style.background = typeColor;

        const progressDisplay = controlsSection.createEl('span', {
          text: `${entry.progress} / ${entry.total}`,
        });
        progressDisplay.addClass('trackly-progress-display');

        const decrementBtn = controlsSection.createEl('button', { text: '-' });
        decrementBtn.addClass('trackly-btn');
        decrementBtn.addClass('trackly-btn-small');
        decrementBtn.style.borderColor = typeColor;
        decrementBtn.addEventListener('click', () => {
          const updated = { ...entry, progress: Math.max(0, entry.progress - 1) };
          this.callbacks.onIncrement(updated, -1);
        });

        const incrementBtn = controlsSection.createEl('button', { text: '+' });
        incrementBtn.addClass('trackly-btn');
        incrementBtn.addClass('trackly-btn-small');
        incrementBtn.style.borderColor = typeColor;
        incrementBtn.addEventListener('click', () => {
          const updated = { ...entry, progress: Math.min(entry.total, entry.progress + 1) };
          this.callbacks.onIncrement(updated, 1);
        });
      }

      const ratingContainer = controlsSection.createEl('span');
      ratingContainer.addClass('trackly-rating-stars');
      for (let i = 1; i <= 5; i++) {
        const star = ratingContainer.createEl('span', {
          text: i <= entry.rating ? '\u2605' : '\u2606',
        });
        star.addClass('trackly-star');
        if (i <= entry.rating) {
          star.style.color = typeColor;
        }
        star.addEventListener('click', () => {
          this.callbacks.onRatingChange(entry, i);
        });
      }

      const statusSelect = controlsSection.createEl('select');
      statusSelect.addClass('trackly-status-select');
      const statuses: Status[] = ['Not Started', 'Started', 'Completed', 'Dropped'];
      for (const status of statuses) {
        const opt = statusSelect.createEl('option', { text: status, value: status });
        if (status === entry.status) opt.selected = true;
      }
      statusSelect.addEventListener('change', (ev) => {
        const target = ev.target as HTMLSelectElement;
        const newStatus = target.value as Status;
        const updatedEntry: MediaEntry = {
          ...entry,
          status: newStatus,
          progress: newStatus === 'Completed' && HAS_PROGRESS[entry.type] ? entry.total : entry.progress,
        };
        this.callbacks.onStatusChange(updatedEntry, newStatus);
      });
    }
  }

  private renderSuggestion(): void {
    const header = this.container.createEl('h2', { text: "What's Next?" });
    header.addClass('trackly-section-header');

    const suggestionContainer = this.container.createEl('div');
    suggestionContainer.addClass('trackly-suggestion-card');

    if (this.suggestedEntry) {
      const typeColor = MEDIA_TYPE_COLORS[this.suggestedEntry.type];

      const typeLabel = suggestionContainer.createEl('span', {
        text: MEDIA_TYPE_LABELS[this.suggestedEntry.type],
      });
      typeLabel.addClass('trackly-type-badge');
      typeLabel.style.background = typeColor;

      const nameEl = suggestionContainer.createEl('span', {
        text: this.suggestedEntry.name,
      });
      nameEl.addClass('trackly-suggestion-name');
    } else {
      const emptyMsg = suggestionContainer.createEl('p', {
        text: 'All items have been started! Great job.',
      });
      emptyMsg.addClass('trackly-empty-state');
    }

    const suggestBtn = suggestionContainer.createEl('button', { text: 'Suggest Another' });
    suggestBtn.addClass('trackly-btn');
    suggestBtn.addClass('trackly-btn-primary');
    suggestBtn.addClass('trackly-suggest-btn');
    suggestBtn.addEventListener('click', () => {
      this.callbacks.onSuggestClick();
    });
  }
}
