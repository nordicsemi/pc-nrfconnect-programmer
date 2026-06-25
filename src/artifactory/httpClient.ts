/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

export abstract class HttpClient<TInput> {
    protected async get<T>(input: TInput): Promise<T>;
    protected async get(input: TInput, blob: true): Promise<Blob>;
    protected async get<T>(input: TInput, blob?: true): Promise<T | Blob> {
        const url: string = this.getUrl(input);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
        return blob ? res.blob() : (res.json() as Promise<T>);
    }

    protected abstract getUrl(input: TInput): string;
}
