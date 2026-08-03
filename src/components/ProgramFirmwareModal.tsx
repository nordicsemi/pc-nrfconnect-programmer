/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    // type AResponse,
    // ArtifactoryClient,
    Button,
    deviceInfo,
    Dialog,
    DialogButton,
    type Firmware,
    FirmwareClient,
    getAppDataDir,
    selectedDevice,
    useHotKey,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { join } from 'path';

import * as fileActions from '../actions/fileActions';
import FirmwareFilter, { type FilterOptions } from './FirmwareFilter';

// interface Firmware {
//     device: string;
//     displayName: string;
//     description: string;
//     name: string;
//     filename: string;
//     version: string;
//     [props: string]: string | string[];
// }

// interface VisibleFirmware extends Omit<Firmware, 'device' | 'filename'> {
//     devices: string[];
// }

interface GroupedFirmware {
    name: string;
    title?: string;
    description?: string;
    firmwares: Firmware[];
    devices: string[];
}

const client = new FirmwareClient({
    server: 'files.nordicsemi.com',
    repo: 'swtools',
    directory: join(getAppDataDir(), 'firmwares'),
});

// const fw: Firmware = (await fwclient.listFirmware({}))[0];
// fwclient.searchVersions(fw);

// listFirmware for the first fetch - returns a list of firmwares
// searchVersions for the second fetch - fw as input - returns list of strings
// getFirmware for download - {...fw, version: v}

// Fix everything with device - easy fix: devide[0], but some fw has more devices
// Make VisibleFirmware work - change the type: should include a list of fw + title and description
// New onclick functions for fw selection
// Fix filtering - how should it work with devices

// npm pack - shared
// npm i --save-dev path

type ModalStage =
    | 'firmwareSelection'
    | 'deviceSelection'
    | 'versionSelection'
    | 'downloadFirmware';

// const client = new ArtifactoryClient(
//     'files.nordicsemi.com',
//     'swtools',
//     join(getAppDataDir(), 'firmwares'),
// );

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

    // useEffect(() => {
    //     client
    //         .searchArtifactory({ latest: 'true' })
    //         // fetch(url)
    //         //     .then(res => res.json())
    //         .then((data: AResponse) => {
    //             const newFirmwares: Firmware[] = (data ?? [])
    //                 .filter(result => result.properties)
    //                 .filter(
    //                     result => result.properties.type?.[0] !== 'Dependency',
    //                 )
    //                 .map(
    //                     result =>
    //                         Object.fromEntries(
    //                             Object.entries(result.properties).map(
    //                                 ([key, values]) => [key, values[0] ?? ''],
    //                             ),
    //                         ) as Firmware,
    //                 );
    //             setFirmwares(newFirmwares);
    //         });
    //     // console.log('test');
    // }, []);

    useEffect(() => {
        client.listFirmware({}).then(setFirmwares);
    }, []);
    const [selectedFirmware, setSelectedFirmware] = useState<Firmware>();
    const [selectedVersion, setSelectedVersion] = useState('');

    const close = () => {
        onClose();
        setSelectedFirmware(undefined);
        setModalStage('firmwareSelection'); // This looks weird when closing
        // What else needs to be done when closing the window?
    };

    return (
        <Dialog isVisible={isVisible} onHide={close}>
            {modalStage === 'firmwareSelection' && (
                <SelectFirmware
                    close={close}
                    setModalStage={setModalStage}
                    setSelectedFirmware={setSelectedFirmware}
                    firmwares={firmwares}
                />
            )}
            {modalStage === 'versionSelection' && selectedFirmware && (
                <SelectVersion
                    selectedFirmware={selectedFirmware}
                    close={close}
                    setModalStage={setModalStage}
                    setSelectedFirmware={setSelectedFirmware}
                    setSelectedVersion={setSelectedVersion}
                />
            )}
            {modalStage === 'downloadFirmware' && selectedFirmware && (
                <DownloadFirmware
                    close={close}
                    setModalStage={setModalStage}
                    selectedFirmware={selectedFirmware}
                    selectedVersion={selectedVersion}
                />
            )}
        </Dialog>
    );
};

const SelectFirmware = ({
    close,
    setModalStage,
    setSelectedFirmware,
    firmwares,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    setSelectedFirmware: (firmware: Firmware | undefined) => void;
    firmwares: Firmware[];
}) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
    const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({});
    // const [visibleFilters, setVisibleFilters] = useState<FilterOptions>({});
    // const [visibleFirmwares, setVisibleFirmwares] = useState<VisibleFirmware[]>(
    //     [],
    // );
    const [firmwareList, setFirmwareList] = useState<GroupedFirmware[]>([]);
    const [nameFilter, setNameFilter] = useState('');
    const [selectedFirmwareGroup, setSelectedFirmwareGroup] =
        useState<GroupedFirmware>();

    const [filterableKeys, setFilterableKeys] = useState<string[]>([]);

    useEffect(() => {
        fetch('../resources/firmware/filterKeys.json')
            .then(res => res.json())
            .then((data: string[]) => setFilterableKeys(data));
    }, []);

    const initialDevice = useRef(useSelector(selectedDevice));

    useEffect(() => {
        const device = initialDevice.current;
        if (device) {
            const deviceName = deviceInfo(device)?.name;
            if (deviceName) {
                setSelectedFilters(prev => ({
                    ...prev,
                    device: [deviceName.toLowerCase().replace(' ', '')],
                }));
            }
        }
    }, []);

    const generateFilterOptions = useCallback((): FilterOptions => {
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
    }, [filterableKeys, firmwares]);

    useEffect(() => {
        setFilterOptions(generateFilterOptions());
    }, [firmwares, generateFilterOptions]);

    // const updateFilterOptions = useCallback(() => {
    //     const keys = new Set<string>();
    //     firmwares.forEach(item =>
    //         Object.entries(item).forEach(([key, value]) => {
    //             if (typeof value === 'string' && filterableKeys.includes(key))
    //                 keys.add(key);
    //         }),
    //     );

    //     return Object.fromEntries(
    //         [...keys].map(key => {
    //             const relevant = firmwares.filter(item =>
    //                 Object.entries(selectedFilters).every(
    //                     ([filterKey, values]) =>
    //                         filterKey === key ||
    //                         values.length === 0 ||
    //                         values.includes(String(item[filterKey])),
    //                 ),
    //             );

    //             const values = new Set<string>();
    //             relevant.forEach(item => {
    //                 const value = item[key];
    //                 if (typeof value === 'string') values.add(value);
    //             });
    //             return [key, [...values].sort()];
    //         }),
    //     );
    // }, [firmwares, selectedFilters, filterableKeys]);

    const readFirmwareValues = (firmware: Firmware, key: string): string[] => {
        const value = (firmware as Record<string, unknown>)[key];
        if (Array.isArray(value))
            return value.filter(v => typeof v === 'string');
        if (typeof value === 'string') return [value];
        return [];
    };

    // const calculateVisibleFilters = (): Record<string, string[]> => {
    //     const result: Record<string, string[]> = {};

    //     filterableKeys.forEach(filterKey => {
    //         const compatible = firmwares.filter(firmware =>
    //             Object.entries(selectedFilters).every(
    //                 ([key, values]) =>
    //                     key === filterKey ||
    //                     values.length === 0 ||
    //                     readFirmwareValues(firmware, key).some(value =>
    //                         values.includes(value),
    //                     ),
    //             ),
    //         );

    //         const options = new Set<string>();
    //         compatible.forEach(firmware => {
    //             readFirmwareValues(firmware, filterKey).forEach(value => {
    //                 options.add(value);
    //             });
    //         });
    //         result[filterKey] = [...options].sort();
    //     });

    //     return result;
    // };

    const visibleFilters = useMemo(() => {
        const result: Record<string, string[]> = {};

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
    }, [firmwares, selectedFilters, filterableKeys]);

    // useEffect(() => {
    //     setVisibleFilters(updateFilterOptions());
    // }, [updateFilterOptions]);

    // useEffect(() => {
    //     setVisibleFirmwares(
    //         firmwares.filter(firmware =>
    //             Object.entries(selectedFilters).every(
    //                 ([key, values]) =>
    //                     values.length === 0 ||
    //                     values.includes(String(firmware[key])),
    //             ),
    //         ),
    //     );
    //     console.log('test2');
    // }, [selectedFilters, firmwares]);

    // useEffect(() => {
    //     const filteredFirmwares = firmwares
    //         .filter(firmware =>
    //             Object.entries(selectedFilters).every(
    //                 ([key, values]) =>
    //                     values.length === 0 ||
    //                     values.includes(String(firmware[key])),
    //             ),
    //         )
    //         .filter(
    //             firmware =>
    //                 firmware.name // change back to displayName when displayName is added to the data
    //                     .toLowerCase()
    //                     .includes(nameFilter.toLowerCase()) ||
    //                 firmware.description
    //                     ?.toLowerCase()
    //                     .includes(nameFilter.toLowerCase()),
    //         );
    //     const groupedFirmwares = filteredFirmwares.reduce<VisibleFirmware[]>(
    //         (result, firmware) => {
    //             const { device, file: _file, ...rest } = firmware;
    //             const existing = result.find(fw => fw.name === rest.name);
    //             if (existing) {
    //                 existing.devices.push(device[0]);
    //             } else {
    //                 result.push({ ...rest, devices: [device[0]] });
    //             }

    //             return result;
    //         },
    //         [],
    //     );
    //     setVisibleFirmwares(groupedFirmwares);
    // }, [firmwares, selectedFilters, nameFilter]);

    useEffect(() => {
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

        const groupedFirmware = filteredFirmwares.reduce<GroupedFirmware[]>(
            (result, firmware) => {
                const existing = result.find(fw => fw.name === firmware.name);
                const filteredDevice = firmware.device.filter(
                    device =>
                        !selectedFilters.device ||
                        selectedFilters.device.length === 0 ||
                        selectedFilters.device.includes(device),
                );
                if (existing) {
                    existing.firmwares.push({
                        ...firmware,
                        device: filteredDevice,
                    });
                    filteredDevice.forEach(value => {
                        if (!existing.devices.includes(value))
                            existing.devices.push(value);
                    });
                } else {
                    result.push({
                        name: firmware.name,
                        title: firmware.title,
                        description: firmware.description,
                        firmwares: [{ ...firmware, device: filteredDevice }],
                        devices: [...filteredDevice],
                    });
                }
                return result;
            },
            [],
        );
        setFirmwareList(groupedFirmware);
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
    return (
        <div className="tw-flex tw-max-h-[90vh] tw-flex-col">
            <Dialog.Header title="Select a firmware" />
            <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden [&_.modal-body]:tw-flex [&_.modal-body]:tw-min-h-0 [&_.modal-body]:tw-flex-1 [&_.modal-body]:tw-flex-col [&_.modal-body]:tw-overflow-y-auto">
                <Dialog.Body>
                    <p className="tw-flex-shrink-0">
                        Select which firmware you want to download
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            // console.log(firmwares);
                            // console.log(firmwareList);
                            // console.log(selectedFilters);
                            console.log(nameFilter.replaceAll(' ', ''));
                        }}
                    >
                        Test
                    </Button>
                    <div className="tw-flex tw-flex-shrink-0 tw-justify-start">
                        <FirmwareFilter
                            selectedFilters={selectedFilters}
                            handleToggle={handleToggle}
                            clearFilters={clearFilters}
                            filterOptions={filterOptions}
                            visibleFilters={visibleFilters}
                        />
                        <FirmwareSearchbar
                            value={nameFilter}
                            onChange={setNameFilter}
                        />
                    </div>
                    {firmwareList.length ? (
                        <div className="tw-mt-5 tw-min-h-[35vh] tw-flex-1 tw-overflow-y-auto tw-border-0 tw-border-t tw-border-solid tw-border-gray-100">
                            {firmwareList.map(firmware => (
                                <div
                                    key={firmware.name}
                                    className="tw-border tw-border-t-0 tw-border-solid tw-border-gray-100"
                                >
                                    <div className="tw-flex tw-w-full tw-flex-nowrap tw-justify-between tw-px-5 tw-py-3">
                                        <div className="tw-flex tw-w-full tw-flex-1 tw-flex-col tw-items-start">
                                            <div className="tw-text-base">
                                                {firmware.title ??
                                                    String(
                                                        firmware.name,
                                                    ).replaceAll('_', ' ')}
                                            </div>
                                            <div className="tw-text-sm">
                                                {firmware.description}
                                            </div>
                                            <div className="tw-text-xs tw-text-gray-400">
                                                {firmware.devices
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
                                                                .length === 1
                                                        ) {
                                                            setModalStage(
                                                                'versionSelection',
                                                            );
                                                            setSelectedFirmware(
                                                                {
                                                                    ...firmware
                                                                        .firmwares[0],
                                                                    device: firmware.devices,
                                                                },
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
                                        firmware.devices.length > 1 && (
                                            <div className="tw-flex tw-flex-wrap tw-justify-start tw-px-4 tw-pb-2">
                                                {firmware.firmwares.map(fw =>
                                                    fw.device.map(device => (
                                                        <Button
                                                            key={device}
                                                            variant="primary-outline"
                                                            onClick={() => {
                                                                setModalStage(
                                                                    'versionSelection',
                                                                );
                                                                setSelectedFirmware(
                                                                    {
                                                                        ...fw,
                                                                        device: [
                                                                            device,
                                                                        ],
                                                                    },
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
                        </div>
                    ) : (
                        <p>no firmwares</p>
                    )}
                </Dialog.Body>
            </div>
            <Dialog.Footer>
                <DialogButton variant="primary-outline" onClick={close}>
                    Close
                </DialogButton>
            </Dialog.Footer>
        </div>
    );
};

const SelectVersion = ({
    selectedFirmware,
    close,
    setModalStage,
    setSelectedFirmware,
    setSelectedVersion,
}: {
    selectedFirmware: Firmware;
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    setSelectedFirmware: (firmware: Firmware | undefined) => void;
    setSelectedVersion: (version: string) => void;
}) => {
    const [versions, setVersions] = useState<string[]>([]);
    const [versionFilter, setVersionFilter] = useState('');

    useEffect(() => {
        client.searchVersions(selectedFirmware).then(setVersions);
    }, [selectedFirmware]);

    // useEffect(() => {
    //     client
    //         .searchArtifactory({
    //             device: firmwareDevice,
    //             name: String(selectedFirmware.name),
    //         })
    //         .then((data: AResponse) => {
    //             const newFirmwares: Firmware[] = (data ?? [])
    //                 .filter(result => result.properties)
    //                 .map(
    //                     result =>
    //                         Object.fromEntries(
    //                             Object.entries(result.properties).map(
    //                                 ([key, values]) => [key, values[0] ?? ''],
    //                             ),
    //                         ) as Firmware,
    //                 );
    //             setFirmwares(newFirmwares);
    //         });
    // }, [firmwareDevice, selectedFirmware]);
    return (
        <>
            <Dialog.Header title="Select version" />
            <Dialog.Body>
                <Button
                    variant="secondary"
                    onClick={() => console.log(versions)}
                >
                    test
                </Button>
                <div>
                    Select which version of{' '}
                    {selectedFirmware.title ?? selectedFirmware.name} you want
                    to download
                </div>
                <div className="tw-flex tw-h-8">
                    <FirmwareSearchbar
                        value={versionFilter}
                        onChange={setVersionFilter}
                    />
                </div>
                <div className="tw-mt-5 tw-border-0 tw-border-b tw-border-solid tw-border-gray-100">
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
                                className="tw- tw-flex tw-w-full tw-flex-nowrap tw-justify-between tw-border tw-border-b-0 tw-border-solid tw-border-gray-100 tw-px-5 tw-py-3"
                            >
                                <div>
                                    <div className="tw-text-base">
                                        {version}
                                    </div>
                                    {/* <div className="t-text-xs tw-text-gray-400">
                                        {f.latest === 'true' && 'latest'}
                                    </div> */}
                                </div>
                                <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-pl-3 tw-pr-2">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={() => {
                                            setModalStage('downloadFirmware');
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
            <Dialog.Footer>
                <DialogButton
                    variant="primary-outline"
                    onClick={() => {
                        setModalStage('firmwareSelection');
                        setSelectedFirmware(undefined);
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton
                    variant="primary-outline"
                    onClick={() => {
                        close();
                    }}
                >
                    Close
                </DialogButton>
            </Dialog.Footer>
        </>
    );
};

const DownloadFirmware = ({
    close,
    setModalStage,
    selectedFirmware,
    selectedVersion,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    selectedFirmware: Firmware;
    selectedVersion: string;
}) => {
    const device = useSelector(selectedDevice);
    const deviceName = device ? deviceInfo(device).name : 'no device';

    const dispatch = useDispatch();

    const openFile = (filename: string) =>
        dispatch(fileActions.openFile(filename));
    return (
        <>
            <Dialog.Header title="Download firmware" />
            <Dialog.Body>
                {selectedFirmware ? (
                    <div>
                        <div className="tw-text-lg">
                            {selectedFirmware.title ?? selectedFirmware.name}
                            {selectedVersion}
                        </div>
                        <div>{selectedFirmware.description}</div>
                        <div>
                            <div>Documentation:</div>
                            <div>{selectedFirmware.documentation}</div>
                        </div>
                        {device &&
                            !(
                                deviceName?.toLowerCase().replace(' ', '') ===
                                selectedFirmware.device[0]
                                    .toLowerCase()
                                    .replace(' ', '')
                            ) && (
                                <Alert variant="warning">
                                    This firmware is not compatible with your
                                    selected device.
                                </Alert>
                            )}
                    </div>
                ) : (
                    <div>No firmware</div>
                )}
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton
                    variant="primary"
                    onClick={() => {
                        console.log(selectedFirmware);
                        client
                            .getFirmware({
                                ...selectedFirmware,
                                version: selectedVersion,
                            })
                            .then(result => {
                                openFile(result.file);
                            });
                    }}
                >
                    Add file
                </DialogButton>
                <DialogButton
                    variant="primary-outline"
                    onClick={() => {
                        setModalStage('versionSelection');
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton variant="primary-outline" onClick={close}>
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
            className="tw-rounded-none tw-border tw-border-solid tw-border-nordicBlue tw-px-2 tw-text-gray-700 placeholder:tw-text-nordicBlue-500 focus:tw-rounded-none focus:tw-border-solid focus:tw-outline focus:tw-outline-2 focus:-tw-outline-offset-2 focus:tw-outline-nordicBlue"
            value={value}
            ref={searchFieldRef}
            onChange={e => onChange(e.target.value)}
            onFocus={() => searchFieldRef.current?.select()}
        />
    );
};
