/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useSelector } from 'react-redux';
import {
    Button,
    deviceInfo,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

export type FilterOptions = Record<string, string[]>;

// const artifactoryUrl = '../resources/firmware/firmwareFilters.json'; // change later
// const tempUrl = '../resources/firmware/filtertest.json';

// Should maybe move this file into ProgramFirmwareModal at some point
export default ({
    selectedFilters,
    handleToggle,
    clearFilters,
    filterOptions,
}: {
    selectedFilters: FilterOptions;
    handleToggle: (key: string, value: string) => void;
    clearFilters: () => void;
    filterOptions: FilterOptions;
}) => {
    // const [filterOptions, setFilterOptions] = useState<FilterOptions>();
    // const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({}); // Maybe pass these as a prop so that the modal knows what filters are selected
    const [isOpen, setIsOpen] = useState(false);
    // const [openKey, setOpenKey] = useState<string | null>(null);

    const device = useSelector(selectedDevice);

    // useEffect(() => {
    //     fetch(artifactoryUrl)
    //         .then(response => response.json())
    //         .then(data => {
    //             setFilterOptions(data);
    //         });
    // }, [filterOptions]);

    // const handleToggle = (key: string, value: string) => {
    //     setSelectedFilters(prev => {
    //         const current = prev[key] ?? [];
    //         const isChecked = current.includes(value);

    //         const updatedFilters = isChecked
    //             ? current.filter(v => v !== value)
    //             : [...current, value];
    //         return { ...prev, [key]: updatedFilters };
    //     });
    // };
    return (
        <>
            <Button variant="secondary" onClick={() => setIsOpen(!isOpen)}>
                Open filter
            </Button>
            <Button
                variant="secondary"
                onClick={() =>
                    console.log(
                        selectedFilters,
                        device,
                        device ? deviceInfo(device) : 'no device',
                    )
                }
            >
                Print filters
            </Button>
            <Button variant="secondary" onClick={() => clearFilters()}>
                Clear filters
            </Button>
            {/* {isOpen &&
                Object.entries(filterOptions ?? {}).map(([key, values]) => (
                    <div
                        key={key}
                        className="tw-flex tw-flex-col tw-justify-center"
                    >
                        {openKey === key ? (
                            <>
                                <Button
                                    variant="primary-outline"
                                    size="lg"
                                    onClick={() => setOpenKey(null)}
                                >
                                    {key}
                                </Button>
                                {values.map(value => (
                                    <div
                                        key={value}
                                        className="tw-flex tw-justify-center"
                                    >
                                        {(selectedFilters[key] ?? []).includes(
                                            value,
                                        ) ? (
                                            <Button
                                                variant="primary"
                                                className="tw-w-full tw-text-left hover:tw-bg-primaryDarkened"
                                                onClick={() =>
                                                    handleToggle(key, value)
                                                }
                                            >
                                                {value}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                className="tw-w-full tw-border-0 tw-text-left hover:tw-bg-nordicBlue-50"
                                                onClick={() =>
                                                    handleToggle(key, value)
                                                }
                                            >
                                                {value}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={() => setOpenKey(key)}
                            >
                                {key}
                            </Button>
                        )}
                    </div>
                ))} */}
            <div>
                <Dropdown onToggle={() => setIsOpen(!isOpen)}>
                    <Dropdown.Toggle variant="outline-primary" active={isOpen}>
                        <span className="mdi mdi-tune" />
                        Filter
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="tw-flex tw-px-2">
                        {Object.entries(filterOptions ?? {}).map(
                            ([key, values]) => (
                                <div
                                    key={key}
                                    className="tw-mx-4 tw-flex tw-h-full tw-flex-col tw-justify-center"
                                >
                                    <div className="tw-mb-2 tw-border-0 tw-border-b tw-border-solid tw-border-gray-300 tw-py-1 tw-capitalize">
                                        {key}
                                    </div>
                                    {values.map(value => (
                                        <div
                                            key={value}
                                            className="tw-mb-1 tw-flex tw-justify-start"
                                        >
                                            <input
                                                type="checkbox"
                                                className="checked:tw-accent-nordicBlue-700"
                                                checked={
                                                    !!selectedFilters[
                                                        key
                                                    ]?.includes(value)
                                                }
                                                onChange={() =>
                                                    handleToggle(key, value)
                                                }
                                            />
                                            <label
                                                htmlFor={value}
                                                className="tw-my-0 tw-ml-1"
                                            >
                                                {value}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ),
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </>
    );
};

// const test = () => {
//     const [filterOptions, setFilterOptions] = useState<FilterOptions>();
//     const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({});
//     const [isOpen, setIsOpen] = useState(false);

//     const handleToggle = (key: string, value: string) => {
//         setSelectedFilters(prev => {
//             const current = prev[key] ?? [];
//             const isChecked = current.includes(value);

//             const updatedFilters = isChecked
//                 ? current.filter(v => v !== value)
//                 : [...current, value];
//             return { ...prev, [key]: updatedFilters };
//         });
//     };
//     return (
//         <>
//             {Object.entries(filterOptions ?? {}).map(([key, values]) => (
//                 <div key={key}>
//                     <Dropdown
//                         items={getItems(values)}
//                         onSelect={item => handleToggle(key, item.value)}
//                     />
//                 </div>
//             ))}
//         </>
//     );
// };

// const getOptionsAsDropdown = (key: string, values: string[]) => {
//     const items: DropdownItem<string>[] = values.map(v => ({
//         label: v,
//         value: v,
//     }));
//     return <Dropdown key={key} items={items} />;
// };

// const getItems = (values: string[]): DropdownItem<string>[] =>
//     values.map(v => ({ label: v, value: v }));
