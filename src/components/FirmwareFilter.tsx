/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Button,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

type FilterOptions = Record<string, string[]>;

const artifactoryUrl = '../resources/firmware/firmwareFilters.json'; // change later
// const tempUrl = '../resources/firmware/filtertest.json';

export default () => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>();
    const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({});
    const [isOpen, setIsOpen] = useState(false);
    const [openKey, setOpenKey] = useState<string | null>(null);

    const device = useSelector(selectedDevice);

    useEffect(() => {
        fetch(artifactoryUrl)
            .then(response => response.json())
            .then(data => {
                setFilterOptions(data);
            });
    }, [filterOptions]);

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
    return (
        <>
            <Button variant="secondary" onClick={() => setIsOpen(!isOpen)}>
                Open filter
            </Button>
            <Button
                variant="secondary"
                onClick={() => console.log(selectedFilters)}
            >
                Print filters
            </Button>
            <Button variant="secondary" onClick={() => setSelectedFilters({})}>
                Clear filters
            </Button>
            {isOpen &&
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
                                    onClick={() =>
                                        setOpenKey(openKey === key ? null : key)
                                    }
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
                                onClick={() =>
                                    setOpenKey(openKey === key ? null : key)
                                }
                            >
                                {key}
                            </Button>
                        )}
                    </div>
                ))}
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
