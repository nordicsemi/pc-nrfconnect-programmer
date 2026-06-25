/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import { logger } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { tester } from '.';

const Testpane: React.FC<{ active: boolean }> = ({ active }) => (
    <>
        <button type="button" onClick={console.log('Test')}>
            Test
        </button>
        <button type="button" onClick={tester}>
            Run
        </button>
    </>
);

export default Testpane;
