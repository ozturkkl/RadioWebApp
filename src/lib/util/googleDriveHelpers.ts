import { signInWithGoogle, user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { deepMerge } from '$lib/util/deepMerge';
import { throttleDebounce } from '$lib/util/throttleDebounce';
import type { UserData } from '$lib/util/userData';

type File = {
	id: string;
	name: string;
};

class GoogleDriveFetcher {
	private access_token: string;
	private boundary = crypto.randomUUID();

	constructor() {
		const access_token = get(user)?.access_token;
		if (!access_token) {
			throw new Error('No access token found');
		}
		this.access_token = access_token;
	}

	public async upsertFile(name: string, file: Record<string, unknown>, merge = false) {
		const { files } = await this.getFiles();
		const existingFiles = files.filter((f) => f.name.split('.').slice(0, -1).join('.') === name);
		const existingFile = existingFiles.length > 0 ? existingFiles[0] : null;

		if (existingFiles.length > 1) {
			console.error(
				`Multiple files with the same name found: ${existingFiles.map((f) => f.id + ': ' + f.name).join(', ')}`
			);
			for (const [index, file] of existingFiles.entries()) {
				if (index === 0) {
					continue;
				}
				await this.deleteFileById(file.id);
			}
		}

		let finalData: Record<string, unknown>;
		if (merge && existingFile) {
			const existingData = await this.getFileById(existingFile.id);
			finalData = {
				...deepMerge(existingData, file),
				_timestamp: Date.now()
			};
		} else {
			finalData = {
				...file,
				_timestamp: Date.now()
			};
		}

		if (existingFile) {
			return this.updateFile(existingFile.id, finalData);
		}

		return this.createFile(name, finalData);
	}
	public async readFile(name: string): Promise<Record<string, unknown> | null> {
		const { files } = await this.getFiles();
		const file = files.find((f) => f.name === name + '.json');

		if (!file) {
			return null;
		}

		return this.getFileById(file.id);
	}
	public async purgeAllFiles() {
		const { files } = await this.getFiles();
		console.log(`Purging ${files.length} files...`, files);
		for (const file of files) {
			await this.deleteFileById(file.id);
		}
	}
	public async getFiles(): Promise<{ files: File[] }> {
		return this.fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder') as Promise<{
			files: File[];
		}>;
	}

	private async getFileById(id: string) {
		return this.fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
	}
	private async deleteFileById(id: string) {
		return this.fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
			method: 'DELETE'
		});
	}
	private async createFile(name: string, file: Record<string, unknown>) {
		const metadata = {
			name: name + '.json',
			parents: ['appDataFolder']
		};
		const body = this.buildBody(file, metadata);

		return this.fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.access_token}`,
				'Content-Type': `multipart/related; boundary=${this.boundary}`
			},
			body: body
		});
	}
	private async updateFile(id: string, file: Record<string, unknown>) {
		const body = this.buildBody(file);

		return this.fetch(
			`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=multipart`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': `multipart/related; boundary=${this.boundary}`
				},
				body: body
			}
		);
	}

	private async fetch(url: string, options: RequestInit = {}) {
		options.headers = {
			...options.headers,
			Authorization: `Bearer ${this.access_token}`
		};
		const response = await fetch(url, options);
		return this.handleResponse(response);
	}
	private async handleResponse(response: Response): Promise<Record<string, unknown>> {
		try {
			const data: Record<string, unknown> = await response.json();
			if (data.error) {
				throw data.error;
			}
			return data;
		} catch (error) {
			if (response.ok) {
				return {};
			}
			if (response.status === 403 || response.status === 401) {
				signInWithGoogle();
			}
			throw error ?? response;
		}
	}
	private buildBody(file: Record<string, unknown>, metadata: Record<string, unknown> = {}) {
		return `\n--${this.boundary}\nContent-Type: application/json; charset=UTF-8\n\n${JSON.stringify(metadata)}\n--${this.boundary}\nContent-Type: application/json; charset=UTF-8\n\n${JSON.stringify(file)}\n--${this.boundary}--\n`;
	}
}

async function saveUserDataToGoogleImpl<K extends keyof UserData>(
	key: K,
	data: UserData[K],
	fetcher: GoogleDriveFetcher
) {
	try {
		if (key === 'cached-podcasts' || key === 'cached-radios') return;
		console.log(`Saving ${key} to Google Drive`);
		await fetcher.upsertFile(key, {
			[key]: data
		});
		console.log(`Successfully saved ${key} to Google Drive`);
	} catch (error) {
		console.error(`Error saving ${key} to Google Drive:`, error);
	}
}

const userDataSaver = new Map<
	keyof UserData,
	(
		key: keyof UserData,
		data: UserData[keyof UserData],
		fetcher: GoogleDriveFetcher
	) => Promise<void> | void
>();

export function saveUserDataToGoogle<K extends keyof UserData>(key: K, data: UserData[K]) {
	const u = get(user);
	if (!u) return;

	const fetcher = new GoogleDriveFetcher();

	if (!userDataSaver.has(key)) {
		const throttledSave = throttleDebounce(saveUserDataToGoogleImpl, 10000, false, true);
		userDataSaver.set(key, throttledSave);
		return throttledSave(key, data, fetcher);
	}
	return userDataSaver.get(key)!(key, data, fetcher);
}

export async function logGoogleUserData() {
	const fetcher = new GoogleDriveFetcher();

	const { files } = await fetcher.getFiles();
	const fileLogPromises = files.map(async (file) => {
		return {
			name: file.name,
			content: await fetcher.readFile(file.name.replace('.json', ''))
		};
	});
	const fileLog = await Promise.all(fileLogPromises);
	console.log(fileLog);
}
