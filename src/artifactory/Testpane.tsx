/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */
import React from 'react';

import { tester } from '.';

const Testpane: React.FC = () => {
    const clickTest = () => {
        console.log('test');
    };

    return (
        <>
            <button type="button" onClick={clickTest}>
                Test
            </button>
            <button type="button" onClick={tester}>
                Run
            </button>
        </>
    );
};

export default Testpane;
