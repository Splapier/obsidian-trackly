import { Component } from 'obsidian';
import type { MediaEntry, MediaType, Status } from '../types';
import { MEDIA_TYPES, STATUS_OPTIONS, MEDIA_TYPE_LABELS, HAS_PROGRESS, MEDIA_TYPE_COLORS } from '../types';
import type { StorageManager } from '../storage/manager';

interface ManageCallbacks {
  onDelete: (id: string, type: MediaType) => void;
  onUpdate: (entry: MediaEntry) => void;
  onTypeChange: (entry: MediaEntry, newType: MediaType) => void;
  onAddClick: () => void;
}

export class ManageView extends Component {
  private storage: StorageManager;
  private callbacks: ManageCallbacks;
  private container: HTMLElement;

  private allEntries: MediaEntry[] = [];
  private searchTerm: string = '';
  private filterType: MediaType | 'all' = 'all';

  private searchInput: HTMLInputElement | null = null;
  private filterSelect: HTMLSelectElement | null = null;

  constructor(container: HTMLElement, storage: StorageManager, callbacks: ManageCallbacks) {
    super();
    this.container = container;
    this.storage = storage;
    this.callbacks = callbacks;
  }

  async load(): Promise<void> {
    this.allEntries = await this.storage.getAllEntries();
    this.renderToolbar();
    this.renderEntryList();
  }

  public setFilterType(type: MediaType | 'all'): void {
    this.filterType = type;
    if (this.filterSelect) {
      this.filterSelect.value = type;
    }
    this.renderEntryList();
  }

  private getFilteredEntries(): MediaEntry[] {
    let entries = this.allEntries;

    if (this.filterType !== 'all') {
      entries = entries.filter((e) => e.type === this.filterType);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      entries = entries.filter((e) => e.name.toLowerCase().includes(term));
    }

    return entries;
  }

  private render(): void {
    this.container.empty();
    this.renderToolbar();
    this.renderEntryList();
  }

  private renderToolbar(): void {
    if (this.searchInput) {
      return;
    }

    const toolbar = this.container.createEl('div');
    toolbar.addClass('trackly-toolbar');

    const searchContainer = toolbar.createEl('div');
    searchContainer.addClass('trackly-search-container');

    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Search media...',
    });
    searchInput.addClass('trackly-search-input');
    searchInput.value = this.searchTerm;
    this.searchInput = searchInput;

    const debouncedSearch = (fn: () => void) => {
      let timeout: number | null = null;
      return () => {
        if (timeout !== null) clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          timeout = null;
          fn();
        }, 200);
      };
    };

    searchInput.addEventListener('input', debouncedSearch(() => {
      this.searchTerm = searchInput.value;
      this.renderEntryList();
    }));

    const filterSelect = toolbar.createEl('select');
    filterSelect.addClass('trackly-filter-select');
    this.filterSelect = filterSelect;

    const allOpt = filterSelect.createEl('option', { text: 'All Types', value: 'all' });
    allOpt.selected = this.filterType === 'all';

    for (const type of MEDIA_TYPES) {
      const opt = filterSelect.createEl('option', {
        text: MEDIA_TYPE_LABELS[type],
        value: type,
      });
      opt.selected = this.filterType === type;
    }
    filterSelect.addEventListener('change', (ev) => {
      const target = ev.target as HTMLSelectElement;
      this.filterType = target.value as MediaType | 'all';
      this.renderEntryList();
    });

    const addBtn = toolbar.createEl('button', { text: '+ Add Entry' });
    addBtn.addClass('trackly-btn');
    addBtn.addClass('trackly-btn-primary');
    addBtn.addEventListener('click', () => {
      this.callbacks.onAddClick();
    });
  }

  private renderEntryList(): void {
    const existing = this.container.querySelectorAll('.trackly-entry-list');
    existing.forEach((el) => el.remove());

    const filtered = this.getFilteredEntries();

    if (filtered.length === 0) {
      const empty = this.container.createEl('p', {
        text: this.allEntries.length === 0
          ? 'No entries yet. Click "+ Add Entry" to get started.'
          : 'No matching entries found.',
      });
      empty.addClass('trackly-empty-state');
      return;
    }

    const list = this.container.createEl('div');
    list.addClass('trackly-entry-list');

    for (const entry of filtered) {
      const typeColor = MEDIA_TYPE_COLORS[entry.type];

      const row = list.createEl('div');
      row.addClass('trackly-entry-row');
      row.style.borderLeftColor = typeColor;
      row.dataset.entryId = entry.id;

      const typeSelect = row.createEl('select');
      typeSelect.addClass('trackly-entry-type');
      typeSelect.style.borderColor = typeColor;
      for (const type of MEDIA_TYPES) {
        const opt = typeSelect.createEl('option', {
          text: MEDIA_TYPE_LABELS[type],
          value: type,
        });
        if (type === entry.type) opt.selected = true;
      }
      typeSelect.addEventListener('change', (ev) => {
        const target = ev.target as HTMLSelectElement;
        const newType = target.value as MediaType;
        this.callbacks.onTypeChange(entry, newType);
      });

      const nameCell = row.createEl('span');
      nameCell.addClass('trackly-entry-name');
      nameCell.contentEditable = 'true';
      nameCell.textContent = entry.name;
      nameCell.addEventListener('blur', () => {
        const newName = nameCell.textContent?.trim() || entry.name;
        if (newName !== entry.name) {
          this.callbacks.onUpdate({ ...entry, name: newName });
        }
      });
      nameCell.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          nameCell.blur();
        }
      });

      const progressCell = row.createEl('span');
      progressCell.addClass('trackly-entry-progress');
      if (HAS_PROGRESS[entry.type]) {
        progressCell.textContent = `${entry.progress}/${entry.total}`;
        progressCell.contentEditable = 'true';
        progressCell.addEventListener('blur', () => {
          const val = progressCell.textContent?.trim();
          if (val) {
            const parts = val.split('/');
            const newProgress = parseInt(parts[0] ?? '0', 10) || entry.progress;
            const newTotal = parts.length > 1 ? parseInt(parts[1] ?? '0', 10) : entry.total;
            this.callbacks.onUpdate({
              ...entry,
              progress: newProgress,
              total: newTotal || entry.total,
            });
          }
        });
      } else {
        progressCell.textContent = '\u2014';
        progressCell.addClass('trackly-dash');
      }

      const statusCell = row.createEl('select');
      statusCell.addClass('trackly-entry-status');
      for (const status of STATUS_OPTIONS) {
        const opt = statusCell.createEl('option', { text: status, value: status });
        if (status === entry.status) opt.selected = true;
      }
      statusCell.addEventListener('change', (ev) => {
        const target = ev.target as HTMLSelectElement;
        const newStatus = target.value as Status;
        let newProgress = entry.progress;
        if (HAS_PROGRESS[entry.type]) {
          if (newStatus === 'Completed') {
            newProgress = entry.total;
          } else if (newStatus === 'Not Started') {
            newProgress = 0;
          }
        }
        this.callbacks.onUpdate({
          ...entry,
          status: newStatus,
          progress: newProgress,
        });
      });

      const ratingContainer = row.createEl('span');
      ratingContainer.addClass('trackly-rating-stars');
      for (let i = 1; i <= 5; i++) {
        const star = ratingContainer.createEl('span', {
          text: i <= entry.rating ? '\u2605' : '\u2606',
        });
        star.addClass('trackly-star');
        if (i <= entry.rating) {
          star.style.color = '#fbbf24';
        }
        star.addEventListener('click', () => {
          const newRating = entry.rating === i ? 0 : i;
          this.callbacks.onUpdate({ ...entry, rating: newRating });
        });
      }

      const deleteBtn = row.createEl('button', { text: '\u2715' });
      deleteBtn.addClass('trackly-btn');
      deleteBtn.addClass('trackly-btn-danger');
      deleteBtn.addClass('trackly-btn-small');
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete "${entry.name}"?`)) {
          this.callbacks.onDelete(entry.id, entry.type);
        }
      });
    }
  }
}
