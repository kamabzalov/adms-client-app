import { observer } from "mobx-react-lite";
import { ReactElement } from "react";
import "./index.css";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { useStore } from "store/hooks";
import { Deal, DealExtData } from "common/models/deals";
import { useFormikContext } from "formik";

export const DealGeneralOdometer = observer((): ReactElement => {
    const store = useStore().dealStore;
    const { values, errors, touched, setFieldValue, getFieldProps } = useFormikContext<
        Deal & DealExtData
    >();
    const {
        dealExtData: { OdomInExcess, OdomNotActual },
        changeDealExtData,
    } = store;
    return (
        <div className='grid deal-general-odometer row-gap-2'>
            <div className='col-3 relative'>
                <span className='p-float-label'>
                    <InputText
                        {...getFieldProps("OdometerReading")}
                        className={`'deal-odometer__text-input w-full' ${
                            touched.OdometerReading && errors.OdometerReading ? "p-invalid" : ""
                        }`}
                        value={values.OdometerReading}
                        onChange={(e) => {
                            setFieldValue("OdometerReading", e.target.value);
                            changeDealExtData({ key: "OdometerReading", value: e.target.value });
                        }}
                    />
                    <label className='float-label'>Reading at Time of Sale (r.)</label>
                </span>
                <small className='p-error bottom-0'>
                    {touched.OdometerReading && errors.OdometerReading
                        ? errors.OdometerReading
                        : ""}
                </small>
            </div>
            <div className='col-3 relative'>
                <span className='p-float-label'>
                    <Dropdown
                        {...getFieldProps("OdomDigits")}
                        value={values.OdomDigits}
                        onChange={(e) => {
                            setFieldValue("OdomDigits", e.value);
                            changeDealExtData({ key: "OdomDigits", value: e.value });
                        }}
                        options={[5, 6, 7, 8]}
                        filter
                        required
                        className='w-full deal-odometer__dropdown'
                    />
                    <label className='float-label'>Number of Digits (req.)</label>
                </span>
                <small className='p-error bottom-0'>
                    {touched.OdomDigits && errors.OdomDigits ? errors.OdomDigits : ""}
                </small>
            </div>
            <div className='col-3'>
                <div className='deal-odometer__checkbox flex px-2'>
                    <Checkbox
                        inputId='deal-odometer-reflects'
                        className='mt-1'
                        name='deal-odometer-reflects'
                        checked={!!OdomInExcess}
                        onChange={() =>
                            changeDealExtData({ key: "OdomInExcess", value: Number(!OdomInExcess) })
                        }
                    />
                    <label htmlFor='deal-odometer-reflects' className='ml-2'>
                        Odometer reflects the milage in EXCESS of its limits
                    </label>
                </div>
            </div>
            <div className='col-3'>
                <div className='deal-odometer__checkbox flex px-2'>
                    <Checkbox
                        inputId='deal-odometer-not-actual'
                        className='mt-1'
                        name='deal-odometer-not-actual'
                        checked={!!OdomNotActual}
                        onChange={() =>
                            changeDealExtData({
                                key: "OdomNotActual",
                                value: Number(!OdomNotActual),
                            })
                        }
                    />
                    <label htmlFor='deal-odometer-not-actual' className='ml-2'>
                        Odometer is NOT the actual mileage - DISCREPANCY
                    </label>
                </div>
            </div>
        </div>
    );
});
