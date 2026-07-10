/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Button,
    deviceInfo,
    Dialog,
    DialogButton,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import FirmwareFilter, { type FilterOptions } from './FirmwareFilter';

interface Firmware {
    device: string;
    displayName: string;
    description: string;
    name: string;
    filename: string;
    [props: string]: string | string[];
}

interface VisibleFirmware extends Omit<Firmware, 'device' | 'filename'> {
    devices: string[];
}

type ModalStage = 'firmwareSelection' | 'downloadFirmware';

// const url = '../resources/firmware/firmwares.json';
// const url = '../resources/firmware/AQLFirmwareList.json';
const url = '../resources/firmware/tempTestData.json';
export default ({
    isVisible,
    onClose,
}: {
    isVisible: boolean;
    onClose: () => void;
}) => {
    const [modalStage, setModalStage] =
        useState<ModalStage>('firmwareSelection');
    // const device = useSelector(selectedDevice);
    const [firmwares, setFirmwares] = useState<Firmware[]>([]);

    // useEffect(() => {
    //     fetch(url)
    //         .then(res => res.json())
    //         .then((data: Firmware[]) => {
    //             setFirmwares(data);
    //             console.log(data);
    //             // fix this function later so that there are no type issues
    //         });
    // }, []);

    useEffect(() => {
        fetch(url)
            .then(res => res.json())
            .then(
                (data: {
                    results: { properties: Record<string, string[]> }[];
                }) => {
                    const newFirmwares: Firmware[] = (data.results ?? [])
                        .filter(result => result.properties)
                        .map(
                            result =>
                                Object.fromEntries(
                                    Object.entries(result.properties).map(
                                        ([key, values]) => [
                                            key,
                                            (values[0] ?? '').replace(
                                                /_/g,
                                                ' ',
                                            ),
                                        ],
                                    ),
                                ) as Firmware,
                        );
                    setFirmwares(newFirmwares);
                },
            );
    }, []);
    // const [SelectedFilters, setSelectedFilters] = useState<FilterOptions>();
    const [selectedFirmware, setSelectedFirmware] = useState<VisibleFirmware>();

    const close = () => {
        onClose();
        setSelectedFirmware(undefined);
        setModalStage('firmwareSelection');
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
            {modalStage === 'downloadFirmware' && (
                <DownloadFirmware
                    close={close}
                    setModalStage={setModalStage}
                    selectedFirmware={selectedFirmware}
                    setSelectedFirmware={setSelectedFirmware}
                />
            )}
        </Dialog>
    );
};

// Should allow user to select what kind of firmware they want to download
const SelectFirmware = ({
    close,
    setModalStage,
    setSelectedFirmware,
    firmwares,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    setSelectedFirmware: (firmware: VisibleFirmware) => void;
    firmwares: Firmware[];
}) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
    const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({});
    const [visibleFilters, setVisibleFilters] = useState<FilterOptions>({});
    const [visibleFirmwares, setVisibleFirmwares] = useState<VisibleFirmware[]>(
        [],
    );
    const [nameFilter, setNameFilter] = useState('');

    const [filterableKeys, setFilterableKeys] = useState<string[]>([]);

    useEffect(() => {
        fetch('../resources/firmware/filterKeys.json')
            .then(res => res.json())
            .then((data: string[]) => setFilterableKeys(data));
    }, []);

    const generateFilterOptions = useCallback(
        (data: Firmware[]): FilterOptions => {
            const sets: Record<string, Set<string>> = {};

            data.forEach(item => {
                Object.entries(item).forEach(([key, value]) => {
                    if (
                        typeof value === 'string' &&
                        filterableKeys.includes(key)
                    )
                        (sets[key] ??= new Set()).add(value);
                });
            });

            return Object.fromEntries(
                Object.entries(sets).map(([key, set]) => [
                    key,
                    [...set].sort(),
                ]),
            );
        },
        [filterableKeys],
    );

    useEffect(() => {
        setFilterOptions(generateFilterOptions(firmwares));
    }, [firmwares, generateFilterOptions]);

    const updateFilterOptions = useCallback(() => {
        const keys = new Set<string>();
        firmwares.forEach(item =>
            Object.entries(item).forEach(([key, value]) => {
                if (typeof value === 'string' && filterableKeys.includes(key))
                    keys.add(key);
            }),
        );

        return Object.fromEntries(
            [...keys].map(key => {
                const relevant = firmwares.filter(item =>
                    Object.entries(selectedFilters).every(
                        ([filterKey, values]) =>
                            filterKey === key ||
                            values.length === 0 ||
                            values.includes(String(item[filterKey])),
                    ),
                );

                const values = new Set<string>();
                relevant.forEach(item => {
                    const value = item[key];
                    if (typeof value === 'string') values.add(value);
                });
                return [key, [...values].sort()];
            }),
        );
    }, [firmwares, selectedFilters, filterableKeys]);

    useEffect(() => {
        setVisibleFilters(updateFilterOptions());
        console.log('test1');
    }, [updateFilterOptions]);

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

    useEffect(() => {
        const filteredFirmwares = firmwares
            .filter(firmware =>
                Object.entries(selectedFilters).every(
                    ([key, values]) =>
                        values.length === 0 ||
                        values.includes(String(firmware[key])),
                ),
            )
            .filter(
                firmware =>
                    firmware.displayName
                        .toLowerCase()
                        .includes(nameFilter.toLowerCase()) ||
                    firmware.description
                        .toLowerCase()
                        .includes(nameFilter.toLowerCase()),
            );
        const groupedFirmwares = filteredFirmwares.reduce<VisibleFirmware[]>(
            (result, firmware) => {
                const { device, filename: _filename, ...rest } = firmware;
                const existing = result.find(fw => fw.name === rest.name);
                if (existing) {
                    existing.devices.push(device);
                } else {
                    result.push({ ...rest, devices: [device] });
                }

                return result;
            },
            [],
        );
        setVisibleFirmwares(groupedFirmwares);
    }, [firmwares, selectedFilters, nameFilter]);

    const handleToggle = (key: string, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[key] ?? [];
            const isChecked = current.includes(value);

            const updatedFilters = isChecked
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [key]: updatedFilters };
        });
        console.log(filterableKeys);
    };
    const clearFilters = () => {
        setSelectedFilters({});
    };
    // const device = useSelector(selectedDevice);
    // const deviceName = device ? deviceInfo(device).name : '';
    return (
        <>
            <Dialog.Header title="Select a firmware" />
            <Dialog.Body>
                <p>Select a program</p>
                {/* Let user select type of firmware here */}
                <div className="tw-flex">
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
                {visibleFirmwares.length ? (
                    <div className="tw-mt-5 tw-border-0 tw-border-b tw-border-solid tw-border-gray-50">
                        {visibleFirmwares
                            // .filter(
                            //     firmware =>
                            //         firmware.device === deviceName ||
                            //         deviceName === '',
                            // )
                            // .filter(firmware =>
                            //     Object.entries(selectedFilters).every(
                            //         ([key, values]) =>
                            //             values.length === 0 ||
                            //             values.includes(String(firmware[key])),
                            //     ),
                            // )
                            .map(firmware => (
                                <div
                                    key={`${firmware.name}${firmware.device}`}
                                    className="tw- tw-flex tw-w-full tw-flex-nowrap tw-justify-between tw-border tw-border-b-0 tw-border-solid tw-border-gray-100 tw-px-5 tw-py-3"
                                >
                                    <div className="tw-flex tw-w-full tw-flex-1 tw-flex-col tw-items-start">
                                        <div className="tw-text-base">
                                            {firmware.displayName}
                                        </div>
                                        <div className="tw-text-sm">
                                            {firmware.description}
                                        </div>
                                        <div className="tw-text-xs tw-text-gray-400">
                                            {firmware.devices.join(', ')}
                                        </div>
                                    </div>
                                    <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-pl-3 tw-pr-2">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => {
                                                setSelectedFirmware(firmware);
                                                setModalStage(
                                                    'downloadFirmware',
                                                );
                                            }}
                                        >
                                            Select
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <p>no firmwares</p>
                )}
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton onClick={close}>Close</DialogButton>
            </Dialog.Footer>
        </>
    );
};

const DownloadFirmware = ({
    close,
    setModalStage,
    selectedFirmware,
    setSelectedFirmware,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    selectedFirmware: VisibleFirmware | undefined;
    setSelectedFirmware: (firmware: VisibleFirmware | undefined) => void;
}) => {
    const device = useSelector(selectedDevice);
    return (
        <>
            <Dialog.Header title="Download firmware" />
            <Dialog.Body>
                <div>
                    You have selected a firmware:{' '}
                    {selectedFirmware
                        ? selectedFirmware.displayName
                        : 'no firmware'}
                </div>
                <div>
                    Selected device:{' '}
                    {device ? deviceInfo(device).name : 'no device'}
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton
                    variant="primary"
                    onClick={() => console.log(selectedFirmware)}
                >
                    Add file
                </DialogButton>
                <DialogButton
                    onClick={() => {
                        setModalStage('firmwareSelection');
                        setSelectedFirmware(undefined);
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton onClick={close}>Close</DialogButton>
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
    const searchFieldREf = useRef<HTMLInputElement>(null);
    return (
        <input
            type="text"
            placeholder="Search..."
            value={value}
            ref={searchFieldREf}
            onChange={e => onChange(e.target.value)}
            onFocus={() => searchFieldREf.current?.select()}
        />
    );
};
