/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { HttpClient } from './httpClient.js';

export type AUrlData = {
    server: string;
    repo: string;
    path: string;
};

export class ArtifactoryClient extends HttpClient<AUrlData> {
    protected getUrl(input: AUrlData): string {
        return `https://${input.server}/ui/api/v1/download?isNativeBrowsing=false&repoKey=${input.repo}&path=${input.path}`;
        // `https://${input.server}/artifactory/${input.repo}${input.path}`;
    }

    public async downloadArtifact(input: AUrlData, dir: string): Promise<void> {
        dir = path.resolve(`${dir}${input.path}`);
        mkdir(path.dirname(dir), { recursive: true });
        const url: string = this.getUrl(input);
        const buffer = Buffer.from(await (await fetch(url)).arrayBuffer());
        await writeFile(dir, buffer);
    }
}
