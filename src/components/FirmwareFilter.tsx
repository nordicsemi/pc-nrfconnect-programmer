/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { Button } from '@nordicsemiconductor/pc-nrfconnect-shared';

export type FilterOptions = Record<string, string[]>;

// Should maybe move this file into ProgramFirmwareModal at some point
export default ({
    selectedFilters,
    handleToggle,
    clearFilters,
    filterOptions,
    visibleFilters,
}: {
    selectedFilters: FilterOptions;
    handleToggle: (key: string, value: string) => void;
    clearFilters: () => void;
    filterOptions: FilterOptions;
    visibleFilters: FilterOptions;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="tw-flex-shrink-0">
            <Dropdown onToggle={() => setIsOpen(!isOpen)}>
                <Dropdown.Toggle variant="outline-primary" active={isOpen}>
                    <span className="mdi mdi-tune" />
                    Filter
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <div className="tw-flex tw-w-max tw-flex-shrink-0 tw-flex-wrap tw-px-2 tw-pb-2">
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
                                                id={value}
                                                className="checked:tw-accent-nordicBlue-700"
                                                disabled={
                                                    !visibleFilters[
                                                        key
                                                    ]?.includes(value)
                                                }
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
                                                className={`tw-my-0 tw-ml-1 ${!visibleFilters[key]?.includes(value) ? 'tw-text-gray-200' : ''}`}
                                            >
                                                {value}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ),
                        )}
                    </div>
                    <div className="tw-flex tw-justify-end tw-px-2">
                        <Button
                            variant="primary-outline"
                            onClick={() => clearFilters()}
                            className="tw-mr-3"
                        >
                            Clear filters
                        </Button>
                    </div>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};
