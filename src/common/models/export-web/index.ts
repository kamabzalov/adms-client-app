import { ReportsColumn } from "../reports";

export interface ExportWebList {
    BodyStyle: string;
    Category: string;
    Cylinders: string;
    DealerCertified: number;
    DealerComments: string;
    DriveLine: string;
    Engine: string;
    ExteriorColor: string;
    FactoryCertified: number;
    GroupClass: number;
    GroupClassName: string;
    InteriorColor: string;
    Make: string;
    Model: string;
    Notes: string;
    Options: number;
    Status: string;
    StockNo: string;
    Transmission: string;
    TypeOfFuel: string;
    VIN: string;
    VINimageUID: string;
    Year: string;
    created: string;
    itemuid: string;
    mileage: string;
    name: string;
    options_codes: number[];
    options_info: string[];
    updated: string;
    useruid: string;
    lastexportdate: string;
    Price: number;
}

export interface ExportWebPostData {
    data: Record<string, unknown>[];
    columns: ReportsColumn[];
}
