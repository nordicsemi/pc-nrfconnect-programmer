/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { Open } from 'unzipper';

export enum FirmwareType {
    MODEM = 'modem',
    APPLICATION = 'application',
    UNKNOWN_APPLICATION = 'unknown-application',
}

interface Manifest {
    files?: { type?: string }[];
}

export const classifyFirmwareZip = async (
    zipPath: string,
): Promise<FirmwareType> => {
    const directory = await Open.file(zipPath);

    // Is Application: check manifest.json with a "file" entry of type "application".
    const manifestEntry = directory.files.find(file =>
        file.path.toLowerCase().endsWith('manifest.json'),
    );
    if (manifestEntry) {
        try {
            const manifest: Manifest = JSON.parse(
                (await manifestEntry.buffer()).toString(),
            );
            if (
                Array.isArray(manifest.files) &&
                manifest.files.some(file => file.type === 'application')
            ) {
                return FirmwareType.APPLICATION;
            }
        } catch {
            /* malformed manifest → fall through */
        }
    }

    const entries = directory.files.map(file => file.path);

    // Is modem firmware
    const isModem = entries.some(name => {
        const l = name.toLowerCase();
        return (
            l.includes('.ipc_dfu') ||
            // l.endsWith('.cbor') ||
            l.includes('firmware.update.image.segments') ||
            l.includes('firmware.update.image.digest') ||
            /(^|\/)mfw_nrf\w+/.test(l)
        );
    });
    if (isModem) return FirmwareType.MODEM;

    return FirmwareType.UNKNOWN_APPLICATION;
};
