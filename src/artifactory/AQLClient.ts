/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { z } from 'zod';

import { HttpClient } from './httpClient.js';

export type AQLQueryData = {
    server: string;
    repo: string;
    [fields: string]: string;
};

const AQLResponseScheme = z.object({
    results: z.array(z.object({ uri: z.string() })),
});

type AQLResponse = z.infer<typeof AQLResponseScheme>;

const AQLDataScheme = z.object({
    repo: z.string(),
    path: z.string(),
    created: z.coerce.date(),
    createdBy: z.string(),
    lastModified: z.string(),
    modifiedBy: z.string(),
    lastUpdated: z.coerce.date(),
    downloadUri: z.string(),
    mimeType: z.string(),
    size: z.coerce.number(),
    checksums: z.object({
        sha1: z.string(),
        md5: z.string(),
        sha256: z.string(),
    }),
    originalChecksums: z.object({
        sha1: z.string(),
        md5: z.string(),
        sha256: z.string(),
    }),
    uri: z.string(),
});

export type AQLData = z.infer<typeof AQLDataScheme>;

export type AQLResult = {
    query: AQLQueryData;
    data: AQLData[];
};

export class AQLClient extends HttpClient<AQLQueryData> {
    protected getUrl(data: AQLQueryData): string {
        const parts: string[] = [];
        parts.push(
            `https://${data.server}/artifactory/api/search/prop?repos=${data.repo}&main_download=true`,
        );

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'repo' && key !== 'server') {
                parts.push(`&${key}=${String(value)}`);
            }
        });

        console.log(parts);
        return parts.join('');
    }

    protected async getData(uri: string): Promise<AQLData> {
        const res = await fetch(uri);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${uri}`);
        return res.json();
    }

    public async searchAQL(data: AQLQueryData): Promise<AQLResult> {
        const results: AQLResponse = AQLResponseScheme.parse(
            await this.get(data),
        );

        const fetches = await Promise.all(
            results.results.map(r => this.getData(r.uri)),
        );

        const out: AQLResult = {
            query: data,
            data: await Promise.all(
                fetches.map(async f =>
                    AQLDataScheme.parse(await this.getData(f.uri)),
                ),
            ),
        };

        return out;
    }
}
