/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
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
    name: string;
    [props: string]: string | boolean;
} // change later and make dynamic based on json

type ModalStage = 'firmwareSelection' | 'downloadFirmware';

const url = '../resources/firmware/firmwares.json';
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

    useEffect(() => {
        fetch(url)
            .then(res => res.json())
            .then((data: Firmware[]) => {
                setFirmwares(data);
                console.log(data);
                // fix this function later so that there are no type issues
            });
    }, []);
    // const [SelectedFilters, setSelectedFilters] = useState<FilterOptions>();
    const [selectedFirmware, setSelectedFirmware] = useState<Firmware>();

    const close = () => {
        onClose();
        setSelectedFirmware(undefined);
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
    setSelectedFirmware: (firmware: Firmware) => void;
    firmwares: Firmware[];
}) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
    const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({});
    const [visibleFirmwares, setVisibleFirmwares] =
        useState<Firmware[]>(firmwares);

    // const updateFilterOptions = (data: Firmware[]): FilterOptions => {
    //     const sets: Record<string, Set<string>> = {};

    //     data.forEach(item => {
    //         Object.entries(item).forEach(([key, value]) => {
    //             if (typeof value !== 'string') return;
    //             (sets[key] ??= new Set()).add(value);
    //         });
    //     });

    //     return Object.fromEntries(
    //         Object.entries(sets).map(([key, set]) => [key, [...set].sort()]),
    //     );
    // };

    const updateFilterOptions = useCallback(() => {
        const keys = new Set<string>();
        firmwares.forEach(item =>
            Object.entries(item).forEach(([key, value]) => {
                if (typeof value === 'string') keys.add(key);
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
    }, [firmwares, selectedFilters]);

    useEffect(() => {
        setFilterOptions(updateFilterOptions());
        console.log('test1');
    }, [updateFilterOptions]);

    useEffect(() => {
        setVisibleFirmwares(
            firmwares.filter(firmware =>
                Object.entries(selectedFilters).every(
                    ([key, values]) =>
                        values.length === 0 ||
                        values.includes(String(firmware[key])),
                ),
            ),
        );
        console.log('test2');
    }, [selectedFilters, firmwares]);

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
    // const device = useSelector(selectedDevice);
    // const deviceName = device ? deviceInfo(device).name : '';
    return (
        <>
            <Dialog.Header title="Select a firmware" />
            <Dialog.Body>
                <p>Select a program</p>
                {/* Let user select type of firmware here */}
                <FirmwareFilter
                    selectedFilters={selectedFilters}
                    handleToggle={handleToggle}
                    clearFilters={clearFilters}
                    filterOptions={filterOptions}
                />
                {firmwares.length ? (
                    <div>
                        <p>test</p>
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
                                <div key={firmware.name}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setSelectedFirmware(firmware);
                                            setModalStage('downloadFirmware');
                                        }}
                                    >
                                        {firmware.name}
                                    </Button>
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
    selectedFirmware: Firmware | undefined;
    setSelectedFirmware: (firmware: Firmware | undefined) => void;
}) => {
    const device = useSelector(selectedDevice);
    return (
        <>
            <Dialog.Header title="Download firmware" />
            <Dialog.Body>
                <p>
                    You have selected a firmware:{' '}
                    {selectedFirmware ? selectedFirmware.name : 'no firmware'}
                    {device ? deviceInfo(device).name : 'no device'}
                </p>
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
