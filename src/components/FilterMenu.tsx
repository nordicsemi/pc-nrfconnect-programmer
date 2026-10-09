/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { type FilterOptions } from './FirmwareFilter';

export default ({
    filterOptions,
    selectedFilters,
    visibleFilters,
    handleToggle,
    clearFilters,
}: {
    filterOptions: FilterOptions;
    selectedFilters: FilterOptions;
    visibleFilters: FilterOptions;
    handleToggle: (key: string, value: string) => void;
    clearFilters: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="tw-relative" ref={wrapperRef}>
            <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="mdi mdi-tune" />
                Filter
            </Button>
            {isOpen && (
                <div className="tw-absolute tw-mt-0.5 tw-flex tw-max-h-[35vh] tw-w-max tw-max-w-[568px] tw-flex-col tw-overflow-hidden tw-border tw-border-solid tw-border-gray-300 tw-bg-white tw-pb-2">
                    <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-row tw-flex-wrap tw-overflow-y-auto tw-px-2 tw-py-2 [&::-webkit-scrollbar-thumb:hover]:tw-bg-gray-700 [&::-webkit-scrollbar-thumb]:tw-rounded-[14px] [&::-webkit-scrollbar-thumb]:tw-border-[5px] [&::-webkit-scrollbar-thumb]:tw-border-solid [&::-webkit-scrollbar-thumb]:tw-border-white [&::-webkit-scrollbar-thumb]:tw-bg-gray-500 [&::-webkit-scrollbar]:tw-h-3.5 [&::-webkit-scrollbar]:tw-w-3.5">
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
                                                className={`tw-my-0 tw-ml-1 tw-max-w-[150px] tw-break-words ${!visibleFilters[key]?.includes(value) ? 'tw-text-gray-200' : ''}`}
                                            >
                                                {value}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ),
                        )}
                    </div>
                    <div className="tw-flex tw-flex-shrink-0 tw-justify-end tw-px-2 tw-pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => clearFilters()}
                            className="tw-mr-3"
                        >
                            Clear filters
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
