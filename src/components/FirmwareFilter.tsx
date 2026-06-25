import React, { useEffect, useState } from 'react';

type FilterOptions = Record<string, string[]>;

const artifactoryUrl = '../../resources/firmware/firmwareFIlters.json'; // change later

export default () => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>();
    const [selectedFilters, setSelectedFilters] = useState();

    useEffect(() => {
        fetch(artifactoryUrl)
            .then(response => response.json())
            .then(data => {
                setFilterOptions(data);
            });
    }, []);
    return (
        <></>
    );
};
