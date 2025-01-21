import { signInWithGoogle } from '$lib/auth/store';
import { get } from 'svelte/store';
import { user } from '$lib/auth/store';
import { deepMerge } from './deepMerge';

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
		const existingFile = files.find((f) => f.name === name + '.json');

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

	private async getFiles(): Promise<{ files: File[] }> {
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
		const body = `
--${this.boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(metadata)}
--${this.boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(file)}
--${this.boundary}--`;

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
		const body = `
--${this.boundary}
Content-Type: application/json; charset=UTF-8

{}
--${this.boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(file)}
--${this.boundary}--`;

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
}

export async function syncUserDataWithGoogle() {
	console.log('Starting Google Drive sync test...');
	const fetcher = new GoogleDriveFetcher();

	await fetcher.purgeAllFiles();

	// Test 1: Create initial file with nested data
	console.log('Test 1: Creating initial file with nested data...');
	const testData1 = {
		user: {
			profile: {
				name: 'John',
				age: 30
			},
			settings: {
				theme: 'dark',
				notifications: true
			}
		},
		preferences: {
			language: 'en'
		}
	};
	const result1 = await fetcher.upsertFile('test-file', testData1);
	console.log('Created file:', result1);

	// Test 2: Update nested data with merge=false (should overwrite)
	console.log('Test 2: Updating without merge...');
	const testData2 = {
		user: {
			profile: {
				name: 'Jane'
			}
		}
	};
	const result2 = await fetcher.upsertFile('test-file', testData2, false);
	console.log('Updated file (overwrite):', result2);

	// Read to verify overwrite
	console.log('Verifying overwrite...');
	const contentsAfterOverwrite = await fetcher.readFile('test-file');
	console.log('File contents after overwrite:', contentsAfterOverwrite);

	// Test 3: Update nested data with merge=true (should preserve nested structure)
	console.log('Test 3: Updating with merge...');
	const testData3 = {
		user: {
			profile: {
				age: 31
			},
			settings: {
				theme: 'light'
			}
		},
		preferences: {
			fontSize: 'large'
		}
	};
	const result3 = await fetcher.upsertFile('test-file', testData3, true);
	console.log('Updated file (merge):', result3);

	// Read to verify merge
	console.log('Verifying merge...');
	const contentsAfterMerge = await fetcher.readFile('test-file');
	console.log('File contents after merge:', contentsAfterMerge);
}
