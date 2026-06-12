import { Plugin } from 'obsidian';
import { TRACKLY_VIEW_TYPE, TracklyTab } from './ui/tab';

export default class TracklyPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(TRACKLY_VIEW_TYPE, (leaf) => new TracklyTab(leaf));

    this.addRibbonIcon('film', 'Open Trackly', () => {
      const leaf = this.app.workspace.getLeaf('tab');
      leaf.setViewState({ type: TRACKLY_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    });

    this.addCommand({
      id: 'open-trackly',
      name: 'Open Trackly',
      callback: () => {
        const leaf = this.app.workspace.getLeaf('tab');
        leaf.setViewState({ type: TRACKLY_VIEW_TYPE, active: true });
        this.app.workspace.revealLeaf(leaf);
      },
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(TRACKLY_VIEW_TYPE);
  }
}
