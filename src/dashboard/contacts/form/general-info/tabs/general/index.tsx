import { observer } from "mobx-react-lite";
import { Dropdown } from "primereact/dropdown";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import { useStore } from "store/hooks";
import { useParams } from "react-router-dom";
import { Contact, ContactOFAC, ContactType } from "common/models/contact";
import {
    checkContactOFAC,
    getContactsTypeList,
    scanContactDL,
} from "http/services/contacts-service";
import { useFormikContext } from "formik";
import { REQUIRED_COMPANY_TYPE_INDEXES } from "dashboard/contacts/form";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { useToast } from "dashboard/common/toast";
import { Status } from "common/models/base-response";
import { TOAST_LIFETIME } from "common/settings";
import { BUYER_ID } from "dashboard/contacts/form/general-info";
import { TextInput } from "dashboard/common/form/inputs";

const enum TOOLTIP_MESSAGE {
    PERSON = "You can input either a person or a business name. If you entered a business name but intended to enter personal details, clear the business name field, and the fields for entering personal data will become active.",
    BUSINESS = "You can input either a person or a business name. If you entered a personal data but intended to enter business name, clear the personal data fields, and the field for entering business name will become active.",
    ONLY_BUSINESS = "The type of contact you have selected requires entering only the business name",
}

export const ContactsGeneralInfo = observer((): ReactElement => {
    const { id } = useParams();
    const [typeList, setTypeList] = useState<ContactType[]>([]);
    const store = useStore().contactStore;
    const { contact, contactFullInfo, contactType, changeContact } = store;
    const toast = useToast();
    const [allowOverwrite, setAllowOverwrite] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { errors, values, setFieldValue } = useFormikContext<Contact>();

    const [savedFirstName, setSavedFirstName] = useState<string>(contact.firstName || "");
    const [savedLastName, setSavedLastName] = useState<string>(contact.lastName || "");
    const [savedMiddleName, setSavedMiddleName] = useState<string>(contact.middleName || "");
    const [savedBusinessName, setSavedBusinessName] = useState<string>(contact.businessName || "");
    const prevTypeRef = useRef<number | null>(null);

    useEffect(() => {
        getContactsTypeList(id || "0").then((response) => {
            if (response) {
                const types = response as ContactType[];
                setTypeList(types);
            }
        });
    }, [id]);

    const handleScanDL = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            scanContactDL(file).then((response) => {
                if (response?.status === Status.ERROR) {
                    toast.current?.show({
                        severity: "error",
                        summary: Status.ERROR,
                        detail: response.error,
                        life: TOAST_LIFETIME,
                    });
                }
            });
            event.target.value = "";
        }
    };

    const isBusinessNameRequired = useMemo(() => {
        return REQUIRED_COMPANY_TYPE_INDEXES.includes(contact.type);
    }, [contact.type]);

    const isControlDisabled = useMemo(() => contact.type !== BUYER_ID, [contact.type]);

    const shouldDisableNameFields = useMemo(() => {
        return (
            isBusinessNameRequired || (!!values.businessName && values.businessName.trim() !== "")
        );
    }, [isBusinessNameRequired, values.businessName]);

    const shouldDisableBusinessName = useMemo(() => {
        return (
            !isBusinessNameRequired && (!!contact.firstName?.trim() || !!contact.lastName?.trim())
        );
    }, [isBusinessNameRequired, contact.firstName, contact.lastName]);

    useEffect(() => {
        if (prevTypeRef.current === contact.type) return;

        if (shouldDisableNameFields) {
            if (contact.firstName) {
                setSavedFirstName(contact.firstName);
                setFieldValue("firstName", "");
                changeContact("firstName", "", false);
            }
            if (contact.lastName) {
                setSavedLastName(contact.lastName);
                setFieldValue("lastName", "");
                changeContact("lastName", "", false);
            }
            if (contact.middleName) {
                setSavedMiddleName(contact.middleName);
                setFieldValue("middleName", "");
                changeContact("middleName", "", false);
            }
        } else {
            if (!contact.firstName && savedFirstName) {
                setFieldValue("firstName", savedFirstName);
                changeContact("firstName", savedFirstName, false);
            }
            if (!contact.lastName && savedLastName) {
                setFieldValue("lastName", savedLastName);
                changeContact("lastName", savedLastName, false);
            }
            if (!contact.middleName && savedMiddleName) {
                setFieldValue("middleName", savedMiddleName);
                changeContact("middleName", savedMiddleName, false);
            }
        }

        prevTypeRef.current = contact.type;
    }, [shouldDisableNameFields, contact.type]);

    useEffect(() => {
        if (prevTypeRef.current === contact.type) return;

        if (shouldDisableBusinessName) {
            if (contact.businessName) {
                setSavedBusinessName(contact.businessName);
                setFieldValue("businessName", "");
                changeContact("businessName", "", false);
            }
        } else {
            if (!contact.businessName && savedBusinessName) {
                setFieldValue("businessName", savedBusinessName);
                changeContact("businessName", savedBusinessName, false);
            }
        }

        prevTypeRef.current = contact.type;
    }, [shouldDisableBusinessName, contact.type]);

    const handleOfacCheck = () => {
        if (!contactFullInfo.firstName || !contactFullInfo.lastName) {
            return;
        }
        checkContactOFAC(id, { ...contactFullInfo }).then((response) => {
            if (response?.status === Status.ERROR) {
                toast.current?.show({
                    severity: "error",
                    summary: Status.ERROR,
                    detail: response.error,
                    life: TOAST_LIFETIME,
                });
            } else {
                store.contactOFAC = response as ContactOFAC;
            }
        });
    };

    return (
        <div className='grid general-info row-gap-2'>
            <div className='col-12 grid'>
                <div className='col-4 relative pr-0 pb-0'>
                    <span className='p-float-label'>
                        <Dropdown
                            optionLabel='name'
                            optionValue='id'
                            value={contact.type || 0}
                            options={typeList}
                            onChange={(e) => {
                                store.contactType = e.value;
                                setFieldValue("type", e.value);
                                changeContact("type", e.value);
                            }}
                            className={`w-full general-info__dropdown ${
                                errors.type ? "p-invalid" : ""
                            }`}
                            pt={{
                                wrapper: {
                                    style: { height: "auto", maxHeight: "none" },
                                },
                            }}
                        />
                        <label className='float-label'>Type (required)</label>
                    </span>
                    <small className='p-error'>{errors.type}</small>
                </div>
            </div>
            {!!contactType && !REQUIRED_COMPANY_TYPE_INDEXES.includes(contactType) ? (
                <>
                    <div className='col-3'>
                        <Button
                            type='button'
                            label='Scan driver license'
                            className='general-info__button'
                            tooltip='Data received from the DL’s backside will fill in related fields'
                            outlined
                            onClick={handleScanDL}
                        />
                        <input
                            type='file'
                            accept='image/*'
                            style={{ display: "none" }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className='col-9'>
                        <div className='general-info-overwrite pb-3'>
                            <Checkbox
                                checked={allowOverwrite}
                                disabled={isControlDisabled}
                                inputId='general-info-overwrite'
                                className='general-info-overwrite__checkbox'
                                onChange={() => setAllowOverwrite(!allowOverwrite)}
                            />
                            <label
                                htmlFor='general-info-overwrite'
                                className='general-info-overwrite__label'
                            >
                                Overwrite data
                            </label>
                            <Button
                                text
                                tooltip='Data received from the DL’s backside will overwrite user-entered data'
                                icon='icon adms-help'
                                outlined
                                type='button'
                                className='general-info-overwrite__icon'
                                tooltipOptions={{
                                    className: "overwrite-tooltip",
                                }}
                            />
                        </div>
                    </div>
                </>
            ) : null}
            {contactType && !REQUIRED_COMPANY_TYPE_INDEXES.includes(contactType) ? (
                <>
                    <div className='col-4 relative'>
                        <TextInput
                            className={`general-info__text-input ${errors.firstName ? "p-invalid" : ""}`}
                            value={contact.firstName || ""}
                            onChange={({ target: { value } }) => {
                                setFieldValue("firstName", value);
                                changeContact("firstName", value);
                            }}
                            onBlur={handleOfacCheck}
                            name={`First Name${!shouldDisableNameFields ? " (required)" : ""}`}
                            tooltip={
                                isBusinessNameRequired
                                    ? TOOLTIP_MESSAGE.ONLY_BUSINESS
                                    : shouldDisableNameFields
                                      ? TOOLTIP_MESSAGE.PERSON
                                      : ""
                            }
                            disabled={shouldDisableNameFields}
                            clearButton
                        />

                        <small className='p-error'>{errors.firstName}</small>
                    </div>

                    <div className='col-4 relative'>
                        <TextInput
                            name='Middle Name'
                            className='general-info__text-input w-full'
                            value={contact.middleName || ""}
                            onChange={({ target: { value } }) => {
                                changeContact("middleName", value);
                                setFieldValue("middleName", value);
                            }}
                            tooltip={
                                isBusinessNameRequired
                                    ? TOOLTIP_MESSAGE.ONLY_BUSINESS
                                    : shouldDisableNameFields
                                      ? TOOLTIP_MESSAGE.PERSON
                                      : ""
                            }
                            disabled={shouldDisableNameFields}
                            clearButton
                        />
                    </div>

                    <div className='col-4 relative'>
                        <TextInput
                            name={`Last Name${!shouldDisableNameFields ? " (required)" : ""}`}
                            className={`general-info__text-input ${errors.lastName ? "p-invalid" : ""}`}
                            value={contact.lastName || ""}
                            onChange={({ target: { value } }) => {
                                setFieldValue("lastName", value);
                                changeContact("lastName", value);
                            }}
                            onBlur={handleOfacCheck}
                            disabled={shouldDisableNameFields}
                            tooltip={
                                isBusinessNameRequired
                                    ? TOOLTIP_MESSAGE.ONLY_BUSINESS
                                    : shouldDisableNameFields
                                      ? TOOLTIP_MESSAGE.PERSON
                                      : ""
                            }
                            clearButton
                        />

                        <small className='p-error'>{errors.lastName}</small>
                    </div>
                </>
            ) : null}
            {!!contactType && (
                <div className='col-4 relative'>
                    <TextInput
                        name={`Business Name${!shouldDisableBusinessName ? " (required)" : ""}`}
                        className={`general-info__text-input w-full ${
                            errors.businessName ? "p-invalid" : ""
                        }`}
                        value={contact.businessName || ""}
                        onChange={({ target: { value } }) => {
                            changeContact("businessName", value);
                            setFieldValue("businessName", value);
                        }}
                        disabled={!!shouldDisableBusinessName}
                        tooltip={shouldDisableBusinessName ? TOOLTIP_MESSAGE.BUSINESS : ""}
                        clearButton
                    />

                    <small className='p-error'>{errors.businessName}</small>
                </div>
            )}
        </div>
    );
});
