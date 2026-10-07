/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    Button,
    deviceInfo,
    Dialog,
    DialogButton,
    type Firmware,
    FirmwareClient,
    selectedDevice,
    useHotKey,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { tmpdir } from 'os';
import { join } from 'path';

import * as fileActions from '../actions/fileActions';
import FirmwareFilter, { type FilterOptions } from './FirmwareFilter';

interface GroupedFirmware {
    name: string;
    title?: string;
    description?: string;
    firmwares: Firmware[];
    devices: Set<string>;
}

const client = new FirmwareClient({
    directory: join(tmpdir(), 'pc-nrfconnect-programmer'),
});

const filterableKeys = ['device', 'type'];

type ModalStage = 'firmwareSelection' | 'versionSelection' | 'downloadFirmware';

export default ({
    isVisible,
    onClose,
}: {
    isVisible: boolean;
    onClose: () => void;
}) => {
    const [modalStage, setModalStage] =
        useState<ModalStage>('firmwareSelection');
    const [firmwares, setFirmwares] = useState<Firmware[]>([]);

    useEffect(() => {
        client.listFirmware({}).then(setFirmwares);
    }, []);

    const [selectedFirmware, setSelectedFirmware] = useState<Firmware>();
    const [versions, setVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [compatibleDevice, setCompatibleDevice] = useState<string[]>([]);

    const close = () => {
        onClose();
        setSelectedFirmware(undefined);
        setVersions([]);
        setSelectedVersion('');
        setCompatibleDevice([]);
        setModalStage('firmwareSelection');
    };

    return (
        <Dialog isVisible={isVisible} onHide={close}>
            {modalStage === 'firmwareSelection' && (
                <SelectFirmware
                    firmwares={firmwares}
                    setSelectedFirmware={setSelectedFirmware}
                    setCompatibleDevice={setCompatibleDevice}
                    setVersions={setVersions}
                    setSelectedVersion={setSelectedVersion}
                    setModalStage={setModalStage}
                    close={close}
                />
            )}
            {modalStage === 'versionSelection' && selectedFirmware && (
                <SelectVersion
                    versions={versions}
                    selectedFirmware={selectedFirmware}
                    setSelectedVersion={setSelectedVersion}
                    setSelectedFirmware={setSelectedFirmware}
                    setModalStage={setModalStage}
                    close={close}
                />
            )}
            {modalStage === 'downloadFirmware' && selectedFirmware && (
                <DownloadFirmware
                    selectedFirmware={selectedFirmware}
                    selectedVersion={selectedVersion}
                    compatibleDevice={compatibleDevice}
                    versions={versions}
                    setModalStage={setModalStage}
                    close={close}
                />
            )}
        </Dialog>
    );
};

const SelectFirmware = ({
    firmwares,
    setSelectedFirmware,
    setCompatibleDevice,
    setVersions,
    setSelectedVersion,
    setModalStage,
    close,
}: {
    firmwares: Firmware[];
    setSelectedFirmware: (firmware: Firmware | undefined) => void;
    setCompatibleDevice: (device: string[]) => void;
    setVersions: (versions: string[]) => void;
    setSelectedVersion: (version: string) => void;
    setModalStage: (stage: ModalStage) => void;
    close: () => void;
}) => {
    const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({});
    const [nameFilter, setNameFilter] = useState('');
    const [selectedFirmwareGroup, setSelectedFirmwareGroup] =
        useState<GroupedFirmware>();

    const filterOptions = useMemo<FilterOptions>(() => {
        const sets: Record<string, Set<string>> = {};

        firmwares.forEach(item => {
            Object.entries(item).forEach(([key, value]) => {
                if (filterableKeys.includes(key)) {
                    if (typeof value === 'string') {
                        (sets[key] ??= new Set()).add(value);
                    } else if (Array.isArray(value)) {
                        sets[key] ??= new Set();
                        value.forEach(v => sets[key].add(String(v)));
                    }
                }
            });
        });
        return Object.fromEntries(
            Object.entries(sets).map(([key, set]) => [key, [...set].sort()]),
        );
    }, [firmwares]);

    const initialDevice = useRef(useSelector(selectedDevice));

    useEffect(() => {
        const device = initialDevice.current;
        if (device) {
            const deviceName = deviceInfo(device)?.name;
            if (
                deviceName &&
                filterOptions.device.includes(
                    deviceName.toLowerCase().replaceAll(' ', ''),
                )
            ) {
                setSelectedFilters(prev => ({
                    ...prev,
                    device: [deviceName.toLowerCase().replace(' ', '')],
                }));
            }
        }
    }, [filterOptions]);

    const readFirmwareValues = (firmware: Firmware, key: string): string[] => {
        const value = (firmware as Record<string, unknown>)[key];
        if (Array.isArray(value))
            return value.filter(v => typeof v === 'string');
        if (typeof value === 'string') return [value];
        return [];
    };

    const visibleFilters = useMemo(() => {
        const result: FilterOptions = {};

        filterableKeys.forEach(filterKey => {
            const compatible = firmwares.filter(firmware =>
                Object.entries(selectedFilters).every(
                    ([key, values]) =>
                        key === filterKey ||
                        values.length === 0 ||
                        readFirmwareValues(firmware, key).some(value =>
                            values.includes(value),
                        ),
                ),
            );

            const options = new Set<string>();
            compatible.forEach(firmware => {
                readFirmwareValues(firmware, filterKey).forEach(value => {
                    options.add(value);
                });
            });
            result[filterKey] = [...options].sort();
        });

        return result;
    }, [firmwares, selectedFilters]);

    const firmwareList = useMemo<GroupedFirmware[]>(() => {
        const filteredFirmwares = firmwares
            .filter(firmware =>
                Object.entries(selectedFilters).every(
                    ([key, values]) =>
                        values.length === 0 ||
                        readFirmwareValues(firmware, key).some(value =>
                            values.includes(value),
                        ),
                ),
            )
            .filter(
                firmware =>
                    firmware.name
                        .toLowerCase()
                        .includes(
                            nameFilter.toLowerCase().replaceAll(' ', ''),
                        ) ||
                    firmware.title
                        ?.toLowerCase()
                        .replaceAll(' ', '')
                        .includes(
                            nameFilter.toLowerCase().replaceAll(' ', ''),
                        ) ||
                    firmware.description
                        ?.toLowerCase()
                        .replaceAll(' ', '')
                        .includes(nameFilter.toLowerCase().replaceAll(' ', '')),
            );

        const deviceFilter = selectedFilters.device ?? [];

        const groupedFirmware = [
            ...filteredFirmwares
                .reduce<Map<string, GroupedFirmware>>((result, firmware) => {
                    const existing = result.get(firmware.name);
                    const filteredDevice = firmware.device.filter(
                        device =>
                            deviceFilter.length === 0 ||
                            deviceFilter.includes(device),
                    );
                    if (existing) {
                        existing.firmwares.push(firmware);
                        filteredDevice.forEach(value => {
                            existing.devices.add(value);
                        });
                        if (!existing.title) {
                            existing.title = firmware.title;
                        }
                        if (!existing.description) {
                            existing.description = firmware.description;
                        }
                    } else {
                        result.set(firmware.name, {
                            name: firmware.name,
                            title: firmware.title,
                            description: firmware.description,
                            firmwares: [firmware],
                            devices: new Set(filteredDevice),
                        });
                    }
                    return result;
                }, new Map())
                .values(),
        ];
        return groupedFirmware;
    }, [firmwares, nameFilter, selectedFilters]);

    const handleToggle = (key: string, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[key] ?? [];
            const isChecked = current.includes(value);

            const updatedFilters = isChecked
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [key]: updatedFilters };
        });
    };
    const clearFilters = () => {
        setSelectedFilters({});
    };

    const [spinner, setSpinner] = useState(false);

    const onSelectedFirmware = (firmware: Firmware, devices: string[]) => {
        setSelectedFirmware(firmware);
        setCompatibleDevice(devices);
        setSpinner(true);
        client.searchVersions(firmware).then(versionList => {
            setVersions(versionList);
            if (versionList.length > 1) {
                setModalStage('versionSelection');
            } else {
                setModalStage('downloadFirmware');
                setSelectedVersion(versionList[0]);
            }
        });
    };

    return (
        <div className="tw-flex tw-max-h-[90vh] tw-flex-col">
            <Dialog.Header title="Select a firmware" showSpinner={spinner} />
            <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden [&_.modal-body]:tw-flex [&_.modal-body]:tw-min-h-0 [&_.modal-body]:tw-flex-1 [&_.modal-body]:tw-flex-col [&_.modal-body]:tw-overflow-y-auto">
                <Dialog.Body>
                    <p className="tw-flex-shrink-0">
                        Select which firmware you want to download
                    </p>
                    <div className="tw-flex tw-flex-shrink-0 tw-justify-start">
                        <FirmwareFilter
                            filterOptions={filterOptions}
                            selectedFilters={selectedFilters}
                            visibleFilters={visibleFilters}
                            handleToggle={handleToggle}
                            clearFilters={clearFilters}
                        />
                        <FirmwareSearchbar
                            value={nameFilter}
                            onChange={setNameFilter}
                        />
                    </div>
                    <div className="tw-mt-5 tw-min-h-[35vh] tw-flex-1 tw-overflow-y-auto">
                        {firmwareList.length ? (
                            <>
                                {firmwareList.map(firmware => (
                                    <div
                                        key={firmware.name}
                                        className="tw-border tw-border-b-0 tw-border-solid tw-border-gray-100 last:tw-border-b"
                                    >
                                        <div className="tw-flex tw-w-full tw-flex-nowrap tw-justify-between tw-px-5 tw-py-3">
                                            <div className="tw-flex tw-w-full tw-flex-1 tw-flex-col tw-items-start">
                                                <div className="tw-text-base">
                                                    {firmware.title ??
                                                        String(
                                                            firmware.name,
                                                        ).replaceAll('_', ' ')}
                                                </div>
                                                <div className="tw-mb-0.5 tw-text-sm tw-text-gray-600">
                                                    {firmware.description}
                                                </div>
                                                <div className="tw-text-xs tw-text-gray-300">
                                                    {[...firmware.devices]
                                                        .sort()
                                                        .join(', ')}
                                                </div>
                                            </div>
                                            <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-pl-3 tw-pr-2">
                                                <Button
                                                    variant="primary"
                                                    size="lg"
                                                    onClick={() => {
                                                        if (
                                                            selectedFirmwareGroup ===
                                                            firmware
                                                        ) {
                                                            setSelectedFirmwareGroup(
                                                                undefined,
                                                            );
                                                        } else {
                                                            setSelectedFirmwareGroup(
                                                                firmware,
                                                            );
                                                            if (
                                                                firmware.devices
                                                                    .size === 1
                                                            ) {
                                                                onSelectedFirmware(
                                                                    {
                                                                        ...firmware
                                                                            .firmwares[0],
                                                                        device: [
                                                                            ...firmware.devices,
                                                                        ],
                                                                    },
                                                                    firmware
                                                                        .firmwares[0]
                                                                        .device,
                                                                );
                                                            }
                                                        }
                                                    }}
                                                >
                                                    Select
                                                </Button>
                                            </div>
                                        </div>
                                        {firmware === selectedFirmwareGroup &&
                                            firmware.devices.size > 1 && (
                                                <div className="tw-flex tw-flex-wrap tw-justify-start tw-px-4 tw-pb-2">
                                                    {firmware.firmwares.map(
                                                        fw =>
                                                            fw.device
                                                                .filter(
                                                                    device =>
                                                                        firmware.devices.has(
                                                                            device,
                                                                        ),
                                                                )
                                                                .map(device => (
                                                                    <Button
                                                                        key={
                                                                            device
                                                                        }
                                                                        variant="secondary"
                                                                        onClick={() => {
                                                                            onSelectedFirmware(
                                                                                {
                                                                                    ...fw,
                                                                                    device: [
                                                                                        device,
                                                                                    ],
                                                                                },
                                                                                fw.device,
                                                                            );
                                                                        }}
                                                                        className="tw-m-1 tw-flex-shrink-0"
                                                                    >
                                                                        {device}
                                                                    </Button>
                                                                )),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <p>no firmwares</p>
                        )}
                    </div>
                </Dialog.Body>
            </div>
            <Dialog.Footer>
                <DialogButton variant="secondary" onClick={close}>
                    Close
                </DialogButton>
            </Dialog.Footer>
        </div>
    );
};

const SelectVersion = ({
    versions,
    selectedFirmware,
    setSelectedVersion,
    setSelectedFirmware,
    setModalStage,
    close,
}: {
    versions: string[];
    selectedFirmware: Firmware;
    setSelectedVersion: (version: string) => void;
    setSelectedFirmware: (firmware: Firmware | undefined) => void;
    setModalStage: (stage: ModalStage) => void;
    close: () => void;
}) => {
    const [versionFilter, setVersionFilter] = useState('');

    return (
        <div className="tw-flex tw-max-h-[90vh] tw-flex-col">
            <Dialog.Header title="Select version" />
            <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden [&_.modal-body]:tw-flex [&_.modal-body]:tw-min-h-0 [&_.modal-body]:tw-flex-1 [&_.modal-body]:tw-flex-col [&_.modal-body]:tw-overflow-y-auto">
                <Dialog.Body>
                    <p>
                        Select which version of{' '}
                        {selectedFirmware.title ?? selectedFirmware.name} you
                        want to download
                    </p>
                    <div className="tw-flex tw-h-8 tw-flex-shrink-0">
                        <FirmwareSearchbar
                            value={versionFilter}
                            onChange={setVersionFilter}
                        />
                    </div>
                    <div className="tw-mt-5 tw-flex-1 tw-justify-start tw-overflow-y-auto">
                        {versions
                            .filter(version =>
                                version
                                    .toLowerCase()
                                    .replaceAll(' ', '')
                                    .replaceAll('.', '')
                                    .includes(
                                        versionFilter
                                            .toLowerCase()
                                            .replaceAll(' ', '')
                                            .replaceAll('.', ''),
                                    ),
                            )
                            .map(version => (
                                <div
                                    key={version}
                                    className="tw-flex tw-w-full tw-flex-nowrap tw-justify-between tw-border tw-border-b-0 tw-border-solid tw-border-gray-100 tw-px-5 tw-py-3 last:tw-border-b"
                                >
                                    <div>
                                        <div className="tw-text-base">
                                            {version}
                                        </div>
                                    </div>
                                    <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-pl-3 tw-pr-2">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => {
                                                setModalStage(
                                                    'downloadFirmware',
                                                );
                                                setSelectedVersion(version);
                                            }}
                                        >
                                            Select
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </Dialog.Body>
            </div>
            <Dialog.Footer>
                <DialogButton
                    variant="secondary"
                    onClick={() => {
                        setModalStage('firmwareSelection');
                        setSelectedFirmware(undefined);
                        // reset versions
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton
                    variant="secondary"
                    onClick={() => {
                        close();
                    }}
                >
                    Close
                </DialogButton>
            </Dialog.Footer>
        </div>
    );
};

const DownloadFirmware = ({
    selectedFirmware,
    selectedVersion,
    compatibleDevice,
    versions,
    setModalStage,
    close,
}: {
    selectedFirmware: Firmware;
    selectedVersion: string;
    compatibleDevice: string[];
    versions: string[];
    setModalStage: (stage: ModalStage) => void;
    close: () => void;
}) => {
    const device = useSelector(selectedDevice);
    const deviceName = device ? deviceInfo(device).name : 'no device';

    const [dependencyFirmware, setDependencyFirmware] = useState<Firmware>();
    // spinner?
    useEffect(() => {
        if (selectedFirmware.dependencies) {
            client
                .fetchFirmware({
                    name: selectedFirmware.dependencies[0].name,
                    version: selectedFirmware.dependencies[0].version,
                    device: selectedFirmware.device,
                })
                .then(result => {
                    if (result) {
                        // TODO add proper empty file download handling
                        setDependencyFirmware(result);
                    }
                });
        }
    }, [selectedFirmware]);

    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState('');

    const dispatch = useDispatch();

    const openFile = (filename: string) =>
        dispatch(fileActions.openFile(filename));

    return (
        <>
            <Dialog.Header
                title="Download firmware"
                showSpinner={downloading}
            />
            <Dialog.Body>
                <div>
                    <div>
                        <div className="tw-text-lg">
                            {selectedFirmware.title ?? selectedFirmware.name}
                        </div>
                        {selectedVersion && (
                            <div className="tw-text-xs">
                                Version {selectedVersion}
                            </div>
                        )}
                    </div>
                    <div className="tw-mt-2">
                        {selectedFirmware.description}
                    </div>
                    {selectedFirmware.documentation && (
                        <div className="tw-mb-3 tw-mt-2">
                            <div>Documentation:</div>
                            <a
                                href={selectedFirmware.documentation}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {selectedFirmware.documentation}
                            </a>
                        </div>
                    )}
                    {dependencyFirmware && (
                        <Alert variant="warning">
                            This firmware has a dependency. Make sure you also
                            download {dependencyFirmware.title} v
                            {dependencyFirmware.version}
                        </Alert>
                    )}
                    {device &&
                        deviceName &&
                        !(
                            deviceName.toLowerCase().replace(' ', '') ===
                                selectedFirmware.device[0]
                                    .toLowerCase()
                                    .replace(' ', '') ||
                            compatibleDevice.includes(
                                deviceName.toLowerCase().replace(' ', ''),
                            )
                        ) && (
                            <Alert variant="warning">
                                Warning: This firmware is not compatible with
                                your selected device.
                            </Alert>
                        )}
                    {downloadError && (
                        <Alert variant="danger">{downloadError}</Alert>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton
                    variant="primary"
                    disabled={downloading}
                    onClick={() => {
                        setDownloading(true);
                        setDownloadError('');
                        client
                            .getFirmware({
                                ...selectedFirmware,
                                version: selectedVersion,
                            })
                            .then(result => {
                                if (result) {
                                    openFile(result.file);
                                } // TODO add proper empty file download handling
                                close();
                            })
                            .catch(err => {
                                console.error(err);
                                setDownloadError(String(err));
                                setDownloading(false);
                            });
                    }}
                >
                    Add file
                </DialogButton>
                <DialogButton
                    variant="secondary"
                    onClick={() => {
                        if (versions.length > 1) {
                            setModalStage('versionSelection');
                        } else {
                            setModalStage('firmwareSelection');
                        }
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton variant="secondary" onClick={close}>
                    Close
                </DialogButton>
            </Dialog.Footer>
        </>
    );
};

const FirmwareSearchbar = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) => {
    const searchFieldRef = useRef<HTMLInputElement>(null);

    useHotKey({
        hotKey: ['mod+e'],
        title: 'Focus search field',
        isGlobal: false,
        action: () => searchFieldRef.current?.focus(),
    });
    return (
        <input
            type="text"
            placeholder="Search..."
            className="tw-rounded-none tw-border tw-border-solid tw-border-gray-700 tw-px-2 tw-text-gray-700 focus:tw-rounded-none focus:tw-border-solid focus:tw-outline focus:tw-outline-2 focus:-tw-outline-offset-2 focus:tw-outline-nordicBlue"
            value={value}
            ref={searchFieldRef}
            onChange={e => onChange(e.target.value)}
            onFocus={() => searchFieldRef.current?.select()}
        />
    );
};
