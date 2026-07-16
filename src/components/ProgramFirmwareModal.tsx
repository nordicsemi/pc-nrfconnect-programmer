/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    type AResponse,
    ArtifactoryClient,
    Button,
    deviceInfo,
    Dialog,
    DialogButton,
    getAppDataDir,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { join } from 'path';

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

type ModalStage =
    | 'firmwareSelection'
    | 'deviceSelection'
    | 'versionSelection'
    | 'downloadFirmware';

// const url = '../resources/firmware/firmwares.json';
// const url = '../resources/firmware/AQLFirmwareList.json';
// const url = '../resources/firmware/tempTestData.json';

const client = new ArtifactoryClient(
    'files.nordicsemi.com',
    'swtools',
    join(getAppDataDir(), 'firmwares'),
);

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
    //     fetch(url)
    //         .then(res => res.json())
    //         .then((data: Firmware[]) => {
    //             setFirmwares(data);
    //             console.log(data);
    //         });
    // }, []);

    useEffect(() => {
        client
            .searchArtifactory({ latest: 'true', type: 'Modem' })
            // fetch(url)
            //     .then(res => res.json())
            .then((data: AResponse) => {
                const newFirmwares: Firmware[] = (data ?? [])
                    .filter(result => result.properties)
                    .map(
                        result =>
                            Object.fromEntries(
                                Object.entries(result.properties).map(
                                    ([key, values]) => [key, values[0] ?? ''],
                                ),
                            ) as Firmware,
                    );
                setFirmwares(newFirmwares);
            });
        console.log('test');
    }, []);
    const [selectedFirmware, setSelectedFirmware] = useState<VisibleFirmware>();
    const [firmwareDevice, setFirmwareDevice] = useState('');

    const close = () => {
        onClose();
        setSelectedFirmware(undefined);
        setFirmwareDevice('');
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
                    selectedFirmware={selectedFirmware}
                    setFirmwareDevice={setFirmwareDevice}
                    firmwares={firmwares}
                />
            )}
            {/* {modalStage === 'deviceSelection' && selectedFirmware && (
                <SelectDevice
                    selectedFirmware={selectedFirmware}
                    close={close}
                    setModalStage={setModalStage}
                />
            )} */}
            {modalStage === 'versionSelection' && selectedFirmware && (
                <SelectVersion
                    selectedFirmware={selectedFirmware}
                    firmwareDevice={firmwareDevice}
                    close={close}
                    setModalStage={setModalStage}
                    setSelectedFirmware={setSelectedFirmware}
                    setFirmwareDevice={setFirmwareDevice}
                />
            )}
            {modalStage === 'downloadFirmware' && (
                <DownloadFirmware
                    close={close}
                    setModalStage={setModalStage}
                    selectedFirmware={selectedFirmware}
                    firmwareDevice={firmwareDevice}
                />
            )}
        </Dialog>
    );
};

const SelectFirmware = ({
    close,
    setModalStage,
    setSelectedFirmware,
    selectedFirmware,
    setFirmwareDevice,
    firmwares,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    setSelectedFirmware: (firmware: VisibleFirmware | undefined) => void;
    selectedFirmware: VisibleFirmware | undefined;
    setFirmwareDevice: (device: string) => void;
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
                    firmware.name // change back to displayName when displayName is added to the data
                        .toLowerCase()
                        .includes(nameFilter.toLowerCase()) ||
                    firmware.description
                        ?.toLowerCase()
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
    return (
        <>
            <Dialog.Header title="Select a firmware" />
            <Dialog.Body>
                <p>Select a program</p>
                <div className="tw-flex tw-justify-start">
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
                    <div className="tw-mt-5 tw-border-0 tw-border-b tw-border-solid tw-border-gray-100">
                        {visibleFirmwares.map(firmware => (
                            <div key={`${firmware.name}${firmware.device}`}>
                                <div className="tw- tw-flex tw-w-full tw-flex-nowrap tw-justify-between tw-border tw-border-b-0 tw-border-solid tw-border-gray-100 tw-px-5 tw-py-3">
                                    <div className="tw-flex tw-w-full tw-flex-1 tw-flex-col tw-items-start">
                                        <div className="tw-text-base">
                                            {
                                                String(firmware.name).replace(
                                                    /_/g,
                                                    ' ',
                                                ) /* change to displayName */
                                            }
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
                                                if (
                                                    selectedFirmware ===
                                                    firmware
                                                ) {
                                                    setSelectedFirmware(
                                                        undefined,
                                                    );
                                                } else {
                                                    setSelectedFirmware(
                                                        firmware,
                                                    );
                                                }
                                            }}
                                        >
                                            Select
                                        </Button>
                                    </div>
                                </div>
                                {firmware === selectedFirmware && (
                                    <div className="tw-flex tw-flex-wrap tw-justify-start tw-border tw-border-y-0 tw-border-solid tw-border-gray-100 tw-px-4 tw-pb-2">
                                        {firmware.devices.map(device => (
                                            <Button
                                                key={device}
                                                variant="primary-outline"
                                                onClick={() => {
                                                    setModalStage(
                                                        'versionSelection',
                                                    );
                                                    setFirmwareDevice(device);
                                                }}
                                                className="tw-m-1 tw-flex-shrink-0"
                                            >
                                                {device}
                                            </Button>
                                        ))}
                                    </div>
                                )}
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

const SelectVersion = ({
    selectedFirmware,
    firmwareDevice,
    close,
    setModalStage,
    setSelectedFirmware,
    setFirmwareDevice,
}: {
    selectedFirmware: VisibleFirmware;
    firmwareDevice: string;
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    setSelectedFirmware: (firmware: VisibleFirmware | undefined) => void;
    setFirmwareDevice: (device: string) => void;
}) => {
    const [version, setVersion] = useState('');
    //  const [verions, setVersions] = useState<string[]>([]);
    const [temp, setTemp] = useState<Firmware[]>([]);

    useEffect(() => {
        client
            .searchArtifactory({
                type: 'Modem',
                device: firmwareDevice,
                name: String(selectedFirmware.name),
            })
            .then((data: AResponse) => {
                const newFirmwares: Firmware[] = (data ?? [])
                    .filter(result => result.properties)
                    .map(
                        result =>
                            Object.fromEntries(
                                Object.entries(result.properties).map(
                                    ([key, values]) => [key, values[0] ?? ''],
                                ),
                            ) as Firmware,
                    );
                setTemp(newFirmwares);
            });
    }, [firmwareDevice, selectedFirmware]);
    return (
        <>
            <Dialog.Header title="Select version" />
            <Dialog.Body>
                <div>{version}</div>
                <div>
                    {selectedFirmware.name}
                    {firmwareDevice}
                </div>
                <div className="tw-border-0 tw-border-b tw-border-solid tw-border-gray-100">
                    {temp.map(f => (
                        <div
                            key={`${f.name}${f.device}${f.version}`}
                            className="tw- tw-flex tw-w-full tw-flex-nowrap tw-justify-between tw-border tw-border-b-0 tw-border-solid tw-border-gray-100 tw-px-5 tw-py-3"
                        >
                            <div>
                                {f.name}
                                {f.version}
                            </div>
                            <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-pl-3 tw-pr-2">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => {
                                        setModalStage('downloadFirmware');
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
                    onClick={() => {
                        setModalStage('firmwareSelection');
                        setSelectedFirmware(undefined);
                        setFirmwareDevice('');
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton
                    onClick={() => {
                        close();
                        setVersion('');
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
    firmwareDevice,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    selectedFirmware: VisibleFirmware | undefined;
    firmwareDevice: string;
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
                    {firmwareDevice}
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
                        setModalStage('versionSelection');
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
    const searchFieldRef = useRef<HTMLInputElement>(null);
    return (
        <input
            type="text"
            placeholder="Search..."
            className="tw-ml-3 tw-rounded-none tw-border tw-border-solid tw-border-nordicBlue tw-px-2 tw-text-gray-700 placeholder:tw-text-nordicBlue-500 focus:tw-rounded-none focus:tw-border-solid focus:tw-outline focus:tw-outline-2 focus:-tw-outline-offset-2 focus:tw-outline-nordicBlue"
            value={value}
            ref={searchFieldRef}
            onChange={e => onChange(e.target.value)}
            onFocus={() => searchFieldRef.current?.select()}
        />
    );
};

// const SelectDevice = ({
//     selectedFirmware,
//     close,
//     setModalStage,
// }: {
//     selectedFirmware: VisibleFirmware;
//     close: () => void;
//     setModalStage: (stage: ModalStage) => void;
// }) => {
//     const device = useSelector(selectedDevice);
//     const deviceName = device ? deviceInfo(device).name : '';
//     return (
//         <>
//             <Dialog.Header title="Select device" />
//             <Dialog.Body>
//                 {deviceName ? (
//                     <>
//                         <div>You have selected {deviceName}</div>
//                         {selectedFirmware.devices.includes(
//                             deviceName.toLowerCase().replace(' ', ''),
//                         ) ? (
//                             <div>
//                                 If you want to continue with your selected
//                                 device, click next
//                             </div>
//                         ) : (
//                             <div>
//                                 Your selected firmware is not compatible with
//                                 your device. Please choose another firmware or
//                                 change to another device.
//                             </div>
//                         )}
//                     </>
//                 ) : (
//                     <div>Please select a device</div>
//                 )}
//                 <div>{selectedFirmware.devices}</div>
//                 <div>
//                     {selectedFirmware.devices.map(d => (
//                         <div key={d}>{d}</div>
//                     ))}
//                 </div>
//             </Dialog.Body>
//             <Dialog.Footer>
//                 <DialogButton
//                     variant="primary"
//                     onClick={() => {
//                         setModalStage('downloadFirmware');
//                     }}
//                 >
//                     Next
//                 </DialogButton>
//                 <DialogButton
//                     onClick={() => {
//                         setModalStage('firmwareSelection');
//                     }}
//                 >
//                     Back
//                 </DialogButton>
//                 <DialogButton onClick={close}>Close</DialogButton>
//             </Dialog.Footer>
//         </>
//     );
// };
