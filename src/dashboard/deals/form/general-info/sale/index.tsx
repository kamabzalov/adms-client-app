import { observer } from "mobx-react-lite";
import { ReactElement, useEffect, useState } from "react";
import "./index.css";
import { Dropdown } from "primereact/dropdown";
import { DateInput } from "dashboard/common/form/inputs";
import { InputText } from "primereact/inputtext";
import { useStore } from "store/hooks";
import {
    getDealInventoryStatuses,
    getDealStatuses,
    getDealTypes,
    getSaleTypes,
} from "http/services/deals.service";
import { Deal, DealExtData, IndexedDealList } from "common/models/deals";
import { CompanySearch } from "dashboard/contacts/common/company-search";
import { InventorySearch } from "dashboard/inventory/common/inventory-search";
import { BaseResponseError } from "common/models/base-response";
import { useToast } from "dashboard/common/toast";
import { useFormikContext } from "formik";

export const DealGeneralSale = observer((): ReactElement => {
    const { values, errors, touched, setFieldValue, getFieldProps } = useFormikContext<
        Deal & DealExtData
    >();

    const store = useStore().dealStore;
    const toast = useToast();
    const { deal, changeDeal, changeDealExtData } = store;

    const [dealTypesList, setDealTypesList] = useState<IndexedDealList[]>([]);
    const [saleTypesList, setSaleTypesList] = useState<IndexedDealList[]>([]);
    const [dealStatusesList, setDealStatusesList] = useState<IndexedDealList[]>([]);
    const [inventoryStatusesList, setInventoryStatusesList] = useState<IndexedDealList[]>([]);

    useEffect(() => {
        getDealTypes().then((res) => {
            const { error } = res as BaseResponseError;
            if (error && toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: error,
                });
            } else {
                setDealTypesList(res as IndexedDealList[]);
            }
        });
        getSaleTypes().then((res) => {
            const { error } = res as BaseResponseError;
            if (error && toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: error,
                });
            } else {
                setSaleTypesList(res as IndexedDealList[]);
            }
        });
        getDealStatuses().then((res) => {
            const { error } = res as BaseResponseError;
            if (error && toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: error,
                });
            } else {
                setDealStatusesList(res as IndexedDealList[]);
            }
        });
        getDealInventoryStatuses().then((res) => {
            const { error } = res as BaseResponseError;
            if (error && toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: error,
                });
            } else {
                setInventoryStatusesList(res as IndexedDealList[]);
            }
        });
    }, [toast]);

    return (
        <section className='grid deal-general-sale row-gap-2'>
            <div className='col-6 relative'>
                <CompanySearch
                    {...getFieldProps("contactuid")}
                    value={values.contactuid}
                    onChange={({ target: { value } }) => {
                        setFieldValue("contactuid", value);
                        changeDeal({ key: "contactuid", value });
                    }}
                    onRowClick={(value) => {
                        setFieldValue("contactuid", value);
                        changeDeal({ key: "contactuid", value });
                    }}
                    name='Buyer Name (required)'
                    className={`${errors.contactuid && touched.contactuid && "p-invalid"}`}
                />
                <small className='p-error'>
                    {touched.contactuid && errors.contactuid ? errors.contactuid : ""}
                </small>
            </div>
            <div className='col-6 relative'>
                <span className='p-float-label'>
                    <InventorySearch
                        {...getFieldProps("inventoryuid")}
                        className={`${errors.inventoryuid && touched.inventoryuid && "p-invalid"}`}
                        onChange={({ target: { value } }) => {
                            setFieldValue("inventoryuid", value);
                            changeDeal({ key: "inventoryuid", value });
                        }}
                        onRowClick={(value) => {
                            setFieldValue("inventoryuid", value);
                            changeDeal({ key: "inventoryuid", value });
                        }}
                        name='Vehicle (required)'
                    />
                    <label className='float-label'></label>
                </span>
                <small className='p-error'>
                    {touched.inventoryuid && errors.inventoryuid ? errors.inventoryuid : ""}
                </small>
            </div>
            <div className='col-6 relative'>
                <span className='p-float-label'>
                    <Dropdown
                        {...getFieldProps("dealtype")}
                        optionLabel='name'
                        optionValue='id'
                        filter
                        required
                        options={dealTypesList}
                        value={values.dealtype}
                        onChange={(e) => {
                            setFieldValue("dealtype", e.value);
                            changeDeal({ key: "dealtype", value: e.value });
                        }}
                        className={`w-full deal-sale__dropdown ${
                            errors.dealtype && touched.dealtype && "p-invalid"
                        }`}
                    />
                    <label className='float-label'>Type of Deal (required)</label>
                </span>
                <small className='p-error'>
                    {touched.dealtype && errors.dealtype ? errors.dealtype : ""}
                </small>
            </div>
            <div className='col-3 relative'>
                <span className='p-float-label'>
                    <Dropdown
                        {...getFieldProps("dealstatus")}
                        optionLabel='name'
                        optionValue='id'
                        value={values.dealstatus}
                        onChange={(e) => {
                            setFieldValue("dealstatus", e.value);
                            changeDeal({ key: "dealstatus", value: e.value });
                        }}
                        options={dealStatusesList}
                        filter
                        required
                        className={`w-full deal-sale__dropdown ${
                            errors.dealstatus && touched.dealstatus && "p-invalid"
                        }`}
                    />
                    <label className='float-label'>Sale status (required)</label>
                </span>
                <small className='p-error'>
                    {touched.dealstatus && errors.dealstatus ? errors.dealstatus : ""}
                </small>
            </div>
            <div className='col-3 relative'>
                <span className='p-float-label'>
                    <Dropdown
                        {...getFieldProps("saletype")}
                        optionLabel='name'
                        optionValue='id'
                        filter
                        required
                        options={saleTypesList}
                        value={values.saletype}
                        onChange={(e) => {
                            setFieldValue("saletype", e.value);
                            changeDeal({ key: "saletype", value: e.value });
                        }}
                        className={`w-full deal-sale__dropdown ${
                            errors.saletype && touched.saletype && "p-invalid"
                        }`}
                    />
                    <label className='float-label'>Sale type (required)</label>
                </span>
                <small className='p-error'>
                    {touched.saletype && errors.saletype ? errors.saletype : ""}
                </small>
            </div>
            <div className='col-3 relative'>
                <DateInput
                    {...getFieldProps("datepurchase")}
                    className={`${errors.datepurchase && touched.datepurchase && "p-invalid"}`}
                    name='Sale date (required)'
                    date={Number(values.datepurchase)}
                    onChange={({ value }) => {
                        setFieldValue("datepurchase", Number(value));
                        changeDeal({ key: "datepurchase", value: Number(value) });
                    }}
                />
                <small className='p-error'>
                    {touched.datepurchase && errors.datepurchase ? errors.datepurchase : ""}
                </small>
            </div>
            <div className='col-3 relative'>
                <DateInput
                    {...getFieldProps("dateeffective")}
                    className={`${errors.dateeffective && touched.dateeffective && "p-invalid"}`}
                    name='First operated (req.)'
                    value={values.dateeffective}
                    onChange={({ value }) => {
                        setFieldValue("dateeffective", Number(value));
                        changeDeal({ key: "dateeffective", value: Number(value) });
                    }}
                />
                <small className='p-error'>
                    {touched.dateeffective && errors.dateeffective ? errors.dateeffective : ""}
                </small>
            </div>
            <div className='col-3 relative'>
                <span className='p-float-label'>
                    <Dropdown
                        {...getFieldProps("inventorystatus")}
                        optionLabel='name'
                        optionValue='id'
                        value={values.inventorystatus}
                        options={inventoryStatusesList}
                        onChange={(e) => {
                            setFieldValue("inventorystatus", e.value);
                            changeDeal({ key: "inventorystatus", value: e.value });
                        }}
                        filter
                        required
                        className={`w-full deal-sale__dropdown ${
                            errors.inventorystatus && touched.inventorystatus && "p-invalid"
                        }`}
                    />
                    <label className='float-label'>New or Used (req.)</label>
                </span>
                <small className='p-error'>
                    {touched.inventorystatus && errors.inventorystatus
                        ? errors.inventorystatus
                        : ""}
                </small>
            </div>

            <div className='col-12 text-line'>
                <h3 className='text-line__title m-0 pr-3'>Vehicle payments tracking</h3>
                <hr className='text-line__line flex-1' />
            </div>

            <div className='col-3'>
                <DateInput
                    name='Warn Overdue After X Days'
                    date={deal.warnOverdueDays}
                    onChange={({ value }) =>
                        changeDeal({ key: "warnOverdueDays", value: Number(value) })
                    }
                />
            </div>
            <div className='col-3 relative'>
                <span className='p-float-label'>
                    <InputText
                        {...getFieldProps("accountuid")}
                        className='w-full deal-sale__text-input'
                        value={values.accountuid}
                        onChange={({ target: { value } }) => {
                            setFieldValue("accountuid", value);
                            changeDeal({ key: "accountuid", value });
                        }}
                    />
                    <label className='float-label'>Account number</label>
                </span>
            </div>

            <hr className='col-12 form-line' />

            <div className='col-6 relative'>
                <span className='p-float-label'>
                    <Dropdown
                        {...getFieldProps("HowFoundOut")}
                        required
                        {...getFieldProps("HowFoundOut")}
                        value={values.HowFoundOut}
                        onChange={(e) => {
                            setFieldValue("HowFoundOut", e.value);
                            changeDealExtData({ key: "HowFoundOut", value: e.value });
                        }}
                        editable
                        filter
                        className={`w-full deal-sale__dropdown ${
                            errors.HowFoundOut && touched.HowFoundOut && "p-invalid"
                        }`}
                    />
                    <label className='float-label'>How did you hear about us? (required)</label>
                </span>
                <small className='p-error'>
                    {errors.HowFoundOut && touched.HowFoundOut ? errors.HowFoundOut : ""}
                </small>
            </div>
            <div className='col-3 relative'>
                <span className='p-float-label'>
                    <InputText
                        {...getFieldProps("SaleID")}
                        className={`deal-sale__text-input w-full ${
                            errors.SaleID && touched.SaleID && "p-invalid"
                        }`}
                        value={values.SaleID}
                        onChange={(e) => {
                            setFieldValue("SaleID", e.target.value);
                            changeDealExtData({ key: "SaleID", value: e.target.value });
                        }}
                    />
                    <label className='float-label'>ROS SaleID (required)</label>
                </span>
                <small className='p-error'>
                    {touched.SaleID && errors.SaleID ? errors.SaleID : ""}
                </small>
            </div>
        </section>
    );
});
