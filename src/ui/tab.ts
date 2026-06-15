import { ItemView, WorkspaceLeaf } from 'obsidian';
import type { MediaEntry, MediaType, Status } from '../types';
import { StorageManager } from '../storage/manager';
import { DashboardView } from './dashboard';
import { ManageView } from './manage';
import { AddEntryModal } from './modals';

export const TRACKLY_VIEW_TYPE = 'trackly-view';

export class TracklyTab extends ItemView {
  private storage: StorageManager;
  private dashboardView: DashboardView | null = null;
  private manageView: ManageView | null = null;

  private navContainer!: HTMLElement;
  private contentContainer!: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.storage = new StorageManager(this.app);
  }

  getViewType(): string {
    return TRACKLY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Trackly';
  }

  getIcon(): string {
    return 'film';
  }

  async onOpen(): Promise<void> {
    await this.storage.ensureAllFilesExist();

    const childContainer = this.containerEl.children[1];
    if (!childContainer) return;

    childContainer.empty();
    childContainer.addClass('trackly-container');

    this.navContainer = childContainer.createEl('div');
    this.navContainer.addClass('trackly-nav');

    const dashboardBtn = this.navContainer.createEl('button', { text: 'Dashboard' });
    dashboardBtn.addClass('trackly-nav-btn');
    dashboardBtn.addClass('trackly-nav-btn-active');
    dashboardBtn.addEventListener('click', () => this.switchView('dashboard'));

    const manageBtn = this.navContainer.createEl('button', { text: 'Manage' });
    manageBtn.addClass('trackly-nav-btn');
    manageBtn.addEventListener('click', () => this.switchView('manage'));

    this.contentContainer = childContainer.createEl('div');
    this.contentContainer.addClass('trackly-content');

    this.switchView('dashboard');
  }

  private async switchView(view: 'dashboard' | 'manage', filterType?: MediaType): Promise<void> {
    this.navContainer.querySelectorAll('.trackly-nav-btn').forEach((btn, index) => {
      const isActive = (index === 0 && view === 'dashboard') || (index === 1 && view === 'manage');
      btn.classList.toggle('trackly-nav-btn-active', isActive);
    });

    this.contentContainer.empty();

    if (view === 'dashboard') {
      this.dashboardView = new DashboardView(
        this.contentContainer,
        this.storage,
        {
          onIncrement: async (entry: MediaEntry) => {
            await this.storage.updateEntry(entry);
            await this.dashboardView?.load();
          },
          onStatusChange: async (entry: MediaEntry, status: Status) => {
            await this.storage.updateEntry({ ...entry, status });
            await this.dashboardView?.load();
          },
          onRatingChange: async (entry: MediaEntry, rating: number) => {
            await this.storage.updateEntry({ ...entry, rating });
            await this.dashboardView?.load();
          },
          onTypeChange: async (entry: MediaEntry, newType: MediaType) => {
            await this.storage.deleteEntry(entry.id, entry.type);
            await this.storage.addEntry({
              name: entry.name,
              type: newType,
              status: entry.status,
              progress: entry.progress,
              total: entry.total,
              rating: entry.rating,
            });
            await this.dashboardView?.load();
          },
          onSuggestClick: async () => {
            await this.dashboardView?.load();
          },
          onStartSuggestion: async (entry: MediaEntry) => {
            await this.storage.updateEntry({
              ...entry,
              status: 'Started',
            });
            await this.dashboardView?.load();
          },
          onFilterClick: (type: MediaType) => {
            this.switchView('manage', type);
          },
        }
      );
      await this.dashboardView.load();
    } else {
      this.manageView = new ManageView(
        this.contentContainer,
        this.storage,
        {
          onDelete: async (id: string, type: MediaType) => {
            await this.storage.deleteEntry(id, type);
            await this.manageView?.load();
          },
          onUpdate: async (entry: MediaEntry) => {
            await this.storage.updateEntry(entry);
            await this.manageView?.load();
          },
          onTypeChange: async (entry: MediaEntry, newType: MediaType) => {
            await this.storage.deleteEntry(entry.id, entry.type);
            await this.storage.addEntry({
              name: entry.name,
              type: newType,
              status: entry.status,
              progress: entry.progress,
              total: entry.total,
              rating: entry.rating,
            });
            await this.manageView?.load();
          },
          onAddClick: () => {
            const modal = new AddEntryModal(this.app, {
              onAdd: async (entryData) => {
                await this.storage.addEntry(entryData);
                await this.manageView?.load();
              },
            });
            modal.open();
          },
        }
      );
      await this.manageView.load();
      if (filterType) {
        this.manageView.setFilterType(filterType);
      }
    }
  }

  async onClose(): Promise<void> {
    this.dashboardView?.unload();
    this.manageView?.unload();
  }
}
