/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { FirmwareType } from '../util/firmwareType';
import type { RootState } from './types';

export interface ModemState {
    isVisible: boolean;
    firmwareType: FirmwareType;
}

const initialState: ModemState = {
    isVisible: false,
    firmwareType: FirmwareType.MODEM,
};

const modemSlice = createSlice({
    name: 'modem',
    initialState,
    reducers: {
        setShowModemProgrammingDialog(state, action: PayloadAction<boolean>) {
            state.isVisible = action.payload;
        },
        setFirmwareType(state, action: PayloadAction<FirmwareType>) {
            state.firmwareType = action.payload;
        },
    },
});

export const getShowModemProgrammingDialog = (state: RootState) =>
    state.app.modem.isVisible;

export const getFirmwareType = (state: RootState) =>
    state.app.modem.firmwareType;

export default modemSlice.reducer;
const { setShowModemProgrammingDialog, setFirmwareType } = modemSlice.actions;
export { setShowModemProgrammingDialog, setFirmwareType };
