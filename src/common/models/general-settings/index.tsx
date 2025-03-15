import { BaseResponseError } from "common/models/base-response";

export interface GeneralSettings extends BaseResponseError {
    dealType: number;
    dealStatus: number;
    feeDefDocumentation: number;
    feeDefvehiclePack: number;
    feeDefTitle: number;
    feeDefTag: number;
    feeDefTransfer: number;
    feeDefSpareTag: number;
    feeDefSpareTransferTag: number;
    taxDefStateVehicleTaxRate: number;
    stocknumSequental: number;
    stocknumPrefix: string;
    stocknumSuffix: string;
    stocknumLast6ofVIN: number;
    stocknumLast8ofVIN: number;
    stocknumFixedDigits: number;
    stocknumtiSequental: number;
    stocknumtiPrefix: string;
    stocknumtiSuffix: string;
    stocknumtiLast6ofVIN: number;
    stocknumtiLast8ofVIN: number;
    stocknumtiFixedDigits: number;
    stocknumtiFromSoldVehicle: number;
    accountStartNumber: number;
    accountFixedDigits: number;
    accountPrefix: string;
    accountSuffix: string;
    accountLateFeeMin: number;
    accountLateFeeMax: number;
    accountLateFeePercentage: number;
    accountLateFeeGracePeriod: number;
    contractDefInterestRate: number;
    contractPaymentFrequency: number;
    leaseMoneyFactor: number;
    leaseDefaultMileage: number;
    leaseOverageAmount: number;
    leaseTerm: number;
    leasePaymentFrequency: number;
    logomediauid: string;
    logoenabled: 0 | 1;
    logoposX: number;
    logoposY: number;
    logoopacity: number;
    exportService: number;
}

export interface WatermarkPostProcessing extends BaseResponseError {
    id: number;
    created: string;
    updated: string;
    deleted: string;
    useruid: string;
    itemuid: string;
    posX: number;
    posY: number;
    fontSize: number;
    fontColor: number;
    bkColor: number;
    fontName: string;
    ppText: string;
    ppPattern: string;
}
