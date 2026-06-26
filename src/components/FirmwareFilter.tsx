import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Button,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

type FilterOptions = Record<string, string[]>;

const artifactoryUrl = '../resources/firmware/firmwareFilters.json'; // change later

export default () => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>();
    const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({});
    const [isOpen, setIsOpen] = useState(false);

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
            {isOpen &&
                Object.entries(filterOptions ?? {}).map(([key, values]) => (
                    <div key={key}>
                        <p>{key}</p>
                        {values.map(value => (
                            <div key={value}>
                                <input
                                    type="checkbox"
                                    value={value}
                                    onClick={() => handleToggle(key, value)}
                                />
                                <p>{value}</p>
                            </div>
                        ))}
                    </div>
                ))}
        </>
    );
};
