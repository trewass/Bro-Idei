import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface IdeaCardsSettings {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  vaultFolder: string;
}

const DEFAULT_SETTINGS: IdeaCardsSettings = {
  supabaseUrl: '',
  supabaseKey: '',
  userId: '',
  vaultFolder: 'IdeaCards'
};

interface RemoteEntry {
  id: string;
  type: string;
  title: string;
  description?: string;
  transcript?: string;
  analysis?: {
    summary: string;
    reasoning: string;
    suggestions: string[];
    marketNotes?: string;
    verdict: string;
    score: number;
  };
  score?: number;
  updatedAt: string;
  links?: string[];
}

export default class IdeaCardsPlugin extends Plugin {
  settings: IdeaCardsSettings = DEFAULT_SETTINGS;
  client: SupabaseClient | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new IdeaCardsSettingTab(this.app, this));
    this.initializeSupabase();

    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          void this.handleFileChange(file);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile) {
          void this.handleFileChange(file);
        }
      })
    );

    if (this.client) {
      await this.pullRemoteEntries();
      this.subscribeToRealtime();
    }
  }

  onunload() {
    this.client = null;
  }

  initializeSupabase() {
    if (!this.settings.supabaseUrl || !this.settings.supabaseKey) {
      new Notice('Idea Cards: укажите Supabase URL и Key в настройках.');
      return;
    }
    this.client = createClient(this.settings.supabaseUrl, this.settings.supabaseKey);
  }

  private async handleFileChange(file: TFile) {
    if (!this.client || !this.isIdeaCardsFile(file)) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter ?? {};
    const id = frontmatter.id ?? '';
    if (!id) {
      return;
    }

    const content = await this.app.vault.read(file);
    const bodyStart = cache?.frontmatterPosition?.end.offset ?? 0;
    const body = content.slice(bodyStart).trim();

    const payload = {
      id,
      type: frontmatter.type,
      title: frontmatter.title ?? file.basename,
      score: frontmatter.score,
      updatedAt: new Date().toISOString(),
      description: frontmatter.description,
      transcript: body,
      links: frontmatter.links ?? [],
      user_id: this.settings.userId
    };

    const { error } = await this.client.from('notes').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Failed to push note', error);
    }
  }

  private isIdeaCardsFile(file: TFile) {
    return file.path.startsWith(`${this.settings.vaultFolder}/`);
  }

  private async pullRemoteEntries() {
    if (!this.client) {
      return;
    }
    const { data, error } = await this.client
      .from('notes')
      .select('*')
      .eq('user_id', this.settings.userId);

    if (error) {
      console.error('Failed to pull notes', error);
      return;
    }

    for (const row of data as RemoteEntry[]) {
      await this.writeEntryToVault(row);
    }
  }

  private async writeEntryToVault(entry: RemoteEntry) {
    const folderPath = this.settings.vaultFolder;
    if (!(await this.app.vault.adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }

    const filePath = `${folderPath}/${entry.updatedAt}_${slugify(entry.title)}_${entry.id}.md`;
    const linkList = (entry.links ?? []).map((linkId) => `"${linkId}"`).join(', ');
    const frontmatter = `---\nid: ${entry.id}\ntitle: "${escapeYaml(entry.title)}"\ntype: ${entry.type}\nscore: ${entry.score ?? entry.analysis?.score ?? ''}\nupdatedAt: ${entry.updatedAt}\ntags: [ideacards]\nlinks: [${linkList}]\n---`;

    const sections = [
      `# ${entry.title}`,
      entry.description ?? '',
      entry.transcript ? `## Transcript\n${entry.transcript}` : '',
      entry.analysis
        ? `## Analysis\n${entry.analysis.summary}\n\n${entry.analysis.reasoning}\n\nSuggestions:\n${(entry.analysis.suggestions ?? []).map((s) => `- ${s}`).join('\n')}`
        : ''
    ];

    const fileContent = `${frontmatter}\n\n${sections.filter(Boolean).join('\n\n')}`;

    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, fileContent);
    } else {
      await this.app.vault.create(filePath, fileContent);
    }
  }

  private subscribeToRealtime() {
    if (!this.client) {
      return;
    }

    this.client
      .channel('obsidian-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => {
        const entry = payload.new as RemoteEntry;
        if (entry?.id) {
          void this.writeEntryToVault(entry);
        }
      })
      .subscribe();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class IdeaCardsSettingTab extends PluginSettingTab {
  plugin: IdeaCardsPlugin;

  constructor(app: App, plugin: IdeaCardsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Idea Cards Sync' });

    new Setting(containerEl)
      .setName('Supabase URL')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.supabaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.supabaseUrl = value;
            await this.plugin.saveSettings();
            this.plugin.initializeSupabase();
          })
      );

    new Setting(containerEl)
      .setName('Supabase Key')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.supabaseKey)
          .onChange(async (value) => {
            this.plugin.settings.supabaseKey = value;
            await this.plugin.saveSettings();
            this.plugin.initializeSupabase();
          })
      );

    new Setting(containerEl)
      .setName('User ID')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.userId)
          .onChange(async (value) => {
            this.plugin.settings.userId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Папка для заметок')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.vaultFolder)
          .onChange(async (value) => {
            this.plugin.settings.vaultFolder = value || 'IdeaCards';
            await this.plugin.saveSettings();
          })
      );
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function escapeYaml(value: string) {
  return value.replace(/"/g, '\\"');
}
