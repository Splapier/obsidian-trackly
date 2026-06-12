import { App, TFile } from 'obsidian';
import type { MediaEntry, MediaType } from '../types';
import { MEDIA_TYPES, MEDIA_TYPE_FILE_NAMES, generateId } from '../types';

export class StorageManager {
  private app: App;
  private pluginFolder: string = 'Trackly';

  constructor(app: App) {
    this.app = app;
  }

  async ensureFolderExists(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.pluginFolder);
    if (!folder) {
      await this.app.vault.createFolder(this.pluginFolder);
    }
  }

  async ensureAllFilesExist(): Promise<void> {
    await this.ensureFolderExists();

    for (const type of MEDIA_TYPES) {
      const fileName = MEDIA_TYPE_FILE_NAMES[type];
      const filePath = `${this.pluginFolder}/${fileName}.md`;
      const existing = this.app.vault.getAbstractFileByPath(filePath);
      if (!existing) {
        await this.app.vault.create(filePath, `---\ntype: ${type}\n---\n`);
      }
    }
  }

  private getFilePath(type: MediaType): string {
    return `${this.pluginFolder}/${MEDIA_TYPE_FILE_NAMES[type]}.md`;
  }

  async getAllEntries(): Promise<MediaEntry[]> {
    const allEntries: MediaEntry[] = [];
    for (const type of MEDIA_TYPES) {
      const entries = await this.getEntriesForType(type);
      allEntries.push(...entries);
    }
    return allEntries;
  }

  async getEntriesForType(type: MediaType): Promise<MediaEntry[]> {
    const filePath = this.getFilePath(type);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
      return [];
    }

    const content = await this.app.vault.read(file);
    return this.parseEntries(content, type);
  }

  private parseEntries(content: string, type: MediaType): MediaEntry[] {
    const entries: MediaEntry[] = [];
    const lines = content.split('\n');
    let currentEntry: Partial<MediaEntry> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.startsWith('## ')) {
        if (currentEntry && currentEntry.id) {
          entries.push(this.normalizeEntry(currentEntry, type));
        }
        currentEntry = { name: line.substring(3) };
      } else if (line.startsWith('- ') && currentEntry) {
        const parts = line.substring(2).split(': ');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join(': ');

          switch (key) {
            case 'id':
              currentEntry.id = value;
              break;
            case 'status':
              currentEntry.status = value as MediaEntry['status'];
              break;
            case 'progress':
              currentEntry.progress = parseInt(value, 10) || 0;
              break;
            case 'total':
              currentEntry.total = parseInt(value, 10) || 0;
              break;
            case 'rating':
              currentEntry.rating = parseInt(value, 10) || 0;
              break;
          }
        }
      }
    }

    if (currentEntry && currentEntry.id) {
      entries.push(this.normalizeEntry(currentEntry, type));
    }

    return entries;
  }

  private normalizeEntry(partial: Partial<MediaEntry>, type: MediaType): MediaEntry {
    return {
      id: partial.id || generateId(),
      name: partial.name || 'Untitled',
      type,
      status: partial.status || 'Not Started',
      progress: partial.progress || 0,
      total: partial.total || 0,
      rating: partial.rating || 0,
    };
  }

  private entryToMarkdown(entry: MediaEntry): string {
    let md = `## ${entry.name}\n`;
    md += `- id: ${entry.id}\n`;
    md += `- status: ${entry.status}\n`;
    md += `- progress: ${entry.progress}\n`;
    md += `- total: ${entry.total}\n`;
    md += `- rating: ${entry.rating}\n`;
    return md;
  }

  private async writeEntriesToFile(type: MediaType, entries: MediaEntry[]): Promise<void> {
    const filePath = this.getFilePath(type);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
      return;
    }

    let content = `---\ntype: ${type}\n---\n`;
    for (const entry of entries) {
      content += '\n' + this.entryToMarkdown(entry);
    }

    await this.app.vault.modify(file, content);
  }

  async addEntry(entry: Omit<MediaEntry, 'id'>): Promise<MediaEntry> {
    const newEntry: MediaEntry = {
      ...entry,
      id: generateId(),
    };

    const existing = await this.getEntriesForType(entry.type);
    existing.push(newEntry);
    await this.writeEntriesToFile(entry.type, existing);

    return newEntry;
  }

  async updateEntry(updated: MediaEntry): Promise<void> {
    const existing = await this.getEntriesForType(updated.type);
    const index = existing.findIndex((e) => e.id === updated.id);
    if (index !== -1) {
      existing[index] = updated;
      await this.writeEntriesToFile(updated.type, existing);
    }
  }

  async deleteEntry(id: string, type: MediaType): Promise<void> {
    const existing = await this.getEntriesForType(type);
    const filtered = existing.filter((e) => e.id !== id);
    await this.writeEntriesToFile(type, filtered);
  }

  async getEntryById(id: string): Promise<MediaEntry | null> {
    for (const type of MEDIA_TYPES) {
      const entries = await this.getEntriesForType(type);
      const found = entries.find((e) => e.id === id);
      if (found) return found;
    }
    return null;
  }
}
