/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Button,
    deviceInfo,
    Dialog,
    DialogButton,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import FirmwareFilter from './FirmwareFilter';

interface Firmware {
    device: string;
    name: string;
    [props: string]: string | boolean;
} // change later and make dynamic based on json

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
    // const device = useSelector(selectedDevice);
    const [firmwares, setFirmwares] = useState<Firmware[]>([
        { device: 'nRF52', name: 'hello world' },
        { device: 'nRF9160 DK', name: 'name' },
    ]);
    const [selectedFirmware, setSelectedFirmware] = useState<Firmware>();

    const close = () => {
        onClose();
        // What else needs to be done when closing the window?
    };

    return (
        <Dialog isVisible={isVisible} onHide={close}>
            {modalStage === 'firmwareSelection' && (
                <SelectFirmware
                    close={close}
                    setModalStage={setModalStage}
                    setSelectedFirmware={setSelectedFirmware}
                    firmwares={firmwares}
                />
            )}
            {modalStage === 'downloadFirmware' && (
                <DownloadFirmware
                    close={close}
                    setModalStage={setModalStage}
                    selectedFirmware={selectedFirmware}
                />
            )}
        </Dialog>
    );
};

// Should allow user to select what kind of firmware they want to download
const SelectFirmware = ({
    close,
    setModalStage,
    setSelectedFirmware,
    firmwares,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    setSelectedFirmware: (formware: Firmware) => void;
    firmwares: Firmware[];
}) => {
    const device = useSelector(selectedDevice);
    const deviceName = device ? deviceInfo(device).name : 'No device';
    return (
        <>
            <Dialog.Header title="Select a firmware" />
            <Dialog.Body>
                <p>Select a program</p>
                {/* Let user select type of firmware here */}
                <FirmwareFilter />
                {firmwares.length ? (
                    <div>
                        <p>test</p>
                        {firmwares
                            .filter(firmware => firmware.device === deviceName)
                            .map(firmware => (
                                <div key={firmware.name}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setSelectedFirmware(firmware);
                                            setModalStage('downloadFirmware');
                                        }}
                                    >
                                        {firmware.name}
                                    </Button>
                                </div>
                            ))}
                    </div>
                ) : (
                    <p>no firmwares</p>
                )}
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton onClick={close}>Close</DialogButton>
            </Dialog.Footer>
        </>
    );
};

const DownloadFirmware = ({
    close,
    setModalStage,
    selectedFirmware,
    setSelectedFirmware,
}: {
    close: () => void;
    setModalStage: (stage: ModalStage) => void;
    selectedFirmware: Firmware | undefined;
    setSelectedFirmware: (firmware: Firmware | undefined) => void;
}) => {
    const device = useSelector(selectedDevice);
    // Should make a type containing all types of firmware
    return (
        <>
            <Dialog.Header title="Download firmware" />
            <Dialog.Body>
                <p>
                    You have selected a firmware:{' '}
                    {selectedFirmware ? selectedFirmware.name : 'no firmware'}
                </p>
                {/* Let user select version */}
            </Dialog.Body>
            <Dialog.Footer>
                <DialogButton variant="primary" onClick={() => console.log()}>
                    Add file
                </DialogButton>
                <DialogButton
                    onClick={() => {
                        setModalStage('firmwareSelection');
                        setSelectedFirmware(undefined);
                    }}
                >
                    Back
                </DialogButton>
                <DialogButton onClick={close}>Close</DialogButton>
            </Dialog.Footer>
        </>
    );
};
