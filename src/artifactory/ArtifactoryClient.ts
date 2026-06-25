/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { HttpClient } from './httpClient.js';

export type AUrlData = {
    server: string;
    repo: string;
    path: string;
};

export class ArtifactoryClient extends HttpClient<AUrlData> {
    protected getUrl(input: AUrlData): string {
        return `https://${input.server}/artifactory/${input.repo}/${input.path}`;
    }

    public async downloadArtifact(url: AUrlData): Promise<Blob> {
        return await this.get(url, true);
    }
}
