/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AQLClient, type AQLQueryData, type AQLResult } from './AQLClient.js';
import { ArtifactoryClient, type AUrlData } from './ArtifactoryClient.js';

export const NordicURL: string = 'files.nordicsemi.com';

export const tester = async () => {
    const testData: AQLQueryData = {
        server: NordicURL,
        repo: 'swtools',
        platform: 'win32-x64',
    };

    const fetcher = new AQLClient();

    const data: AQLResult = await fetcher.searchAQL(testData);

    console.log('Test fetch:');
    console.log(data);

    const url: AUrlData = {
        server: data.query.server,
        repo: data.query.repo,
        path: data.data[0].path,
    };

    const downloader = new ArtifactoryClient();

    const blob = await downloader.downloadArtifact(url);

    console.log(blob);
};
