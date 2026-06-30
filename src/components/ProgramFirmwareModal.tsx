/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Dialog,
    DialogButton,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import FirmwareFilter from './FirmwareFilter';

interface Sample {
    name: string;
    description: string;
    versions: string[];
}

type ModalStage = 'firmwareSelection' | 'downloadFirmware';
export default ({
    isVisible,
    onClose,
}: {
    isVisible: boolean;
    onClose: () => void;
}) => {
    // const [isVisible, setIsVisible] = useState(true);
    const [modalStage, setModalStage] =
        useState<ModalStage>('firmwareSelection');
    const [firmwareType, setFirmwareType] = useState('');
    // const device = useSelector(selectedDevice);
    const [samples, setSamples] = useState();

    const close = () => {
        onClose();
        setFirmwareType('');
        // What else needs to be done when closing the window?
    };

    return (
        <Dialog isVisible={isVisible} onHide={close}>
            {modalStage === 'firmwareSelection' && (
                <SelectFirmwareType
                    close={close}
                    setFirmwareType={setFirmwareType}
                />
            )}
            {modalStage === 'downloadFirmware' && (
                <SelectVersion
                    close={close}
                    setModalStage={setModalStage}
                    firmwareType={firmwareType}
                />
            )}
        </Dialog>
    );
};

// Should allow user to select what kind of firmware they want to download
const SelectFirmwareType = ({
    close,
    setFirmwareType,
}: {
    close: () => void;
    setFirmwareType: (firmwareType: string) => void; // change to a custom type later
}) => {
    const device = useSelector(selectedDevice);
    return (
        <>
            <Dialog.Header title="Select a firmware" />
            <Dialog.Body>
                <p>Select a program</p>
                {/* Let user select type of firmware here */}
                <FirmwareFilter />
                <p>test</p>
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton onClick={close}>Close</DialogButton>
            </Dialog.Footer>
        </>
    );
};

// First select type of firmware, then search for all matching firmwares, then select version

// Create another window that allows user to select what version

const SelectVersion = ({
    close,
    setModalStage,
    firmwareType,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    firmwareType: string; // change later
}) => {
    const device = useSelector(selectedDevice);
    // Should make a type containing all types of firmware
    return (
        <>
            <Dialog.Header title="Select version" />
            <Dialog.Body>
                <p>Select version</p>
                {/* Let user select version */}
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton
                    onClick={() => {
                        setModalStage('downloadFirmware');
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton onClick={close}>Close</DialogButton>
            </Dialog.Footer>
        </>
    );
};
