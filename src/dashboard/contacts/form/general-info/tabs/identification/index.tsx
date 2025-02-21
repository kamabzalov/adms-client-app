import { observer } from "mobx-react-lite";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ReactElement, useEffect, useMemo, useRef } from "react";
import "./index.css";
import { DateInput } from "dashboard/common/form/inputs";
import {
    FileUpload,
    FileUploadHeaderTemplateOptions,
    FileUploadSelectEvent,
} from "primereact/fileupload";
import { Button } from "primereact/button";
import { useStore } from "store/hooks";
import { STATES_LIST } from "common/constants/states";
import { DLSide } from "store/stores/contact";
import { useParams } from "react-router-dom";
import { Loader } from "dashboard/common/loader";
import { useToast } from "dashboard/common/toast";
import { TOAST_LIFETIME } from "common/settings";
import { BUYER_ID, GENERAL_CONTACT_TYPE } from "dashboard/contacts/form/general-info";
import dlFrontImage from "assets/images/empty_front_dl.svg";
import dlBackImage from "assets/images/empty_back_dl.svg";
import uploadImage from "assets/images/upload.svg";
import { Image } from "primereact/image";
import { InputMask } from "primereact/inputmask";
import { BaseResponseError, Status } from "common/models/base-response";

const SexList = [
    {
        name: "Male",
    },
    {
        name: "Female",
    },
];

enum DLSides {
    FRONT = "front",
    BACK = "back",
}

const { BUYER, CO_BUYER } = GENERAL_CONTACT_TYPE;

interface ContactsIdentificationInfoProps {
    type?: typeof BUYER | typeof CO_BUYER;
}

export const ContactsIdentificationInfo = observer(
    ({ type }: ContactsIdentificationInfoProps): ReactElement => {
        const { id } = useParams();
        const store = useStore().contactStore;
        const {
            contact,
            contactExtData,
            changeContact,
            changeContactExtData,
            frontSideDL,
            backSideDL,
            coBuyerFrontSideDL,
            coBuyerBackSideDL,
            getImagesDL,
            getCoBuyerContact,
            frontSideDLurl,
            backSideDLurl,
            coBuyerFrontSideDLurl,
            coBuyerBackSideDLurl,
            isLoading,
        } = store;
        const toast = useToast();
        const fileUploadFrontRef = useRef<FileUpload>(null);
        const fileUploadBackRef = useRef<FileUpload>(null);
        const coBuyerFileUploadFrontRef = useRef<FileUpload>(null);
        const coBuyerFileUploadBackRef = useRef<FileUpload>(null);
        const prevCoBuyerUID = useRef<string>("");

        useEffect(() => {
            getImagesDL();
        }, [contact]);

        const isControlDisabled = useMemo(
            () => type === CO_BUYER && contact.type !== BUYER_ID,
            [type, contact.type]
        );

        useEffect(() => {
            if (type !== CO_BUYER) return;

            if (!contact.cobuyeruid || contact.cobuyeruid === prevCoBuyerUID.current) return;

            prevCoBuyerUID.current = contact.cobuyeruid;

            getCoBuyerContact();
        }, [type, contact.cobuyeruid, getCoBuyerContact]);

        useEffect(() => {
            if (frontSideDL.size) {
                store.frontSideDLurl = URL.createObjectURL(frontSideDL);
            }

            if (backSideDL.size) {
                store.backSideDLurl = URL.createObjectURL(backSideDL);
            }
        }, []);

        const onTemplateSelect = (e: FileUploadSelectEvent, side: DLSide, isCoBuyer: boolean) => {
            store.isContactChanged = true;
            if (side === DLSides.FRONT) {
                isCoBuyer
                    ? (store.coBuyerFrontSideDL = e.files[0])
                    : (store.frontSideDL = e.files[0]);
            }
            if (side === DLSides.BACK) {
                isCoBuyer
                    ? (store.coBuyerBackSideDL = e.files[0])
                    : (store.backSideDL = e.files[0]);
            }
        };

        const handleDeleteImage = (side: DLSide, withRequest?: boolean) => {
            if (type === CO_BUYER) {
                if (side === DLSides.FRONT) {
                    coBuyerFileUploadFrontRef.current?.clear();
                    store.coBuyerFrontSideDL = {} as File;
                    changeContact("dluidfront", "");
                } else {
                    coBuyerFileUploadBackRef.current?.clear();
                    store.coBuyerBackSideDL = {} as File;
                    changeContact("dluidback", "");
                }
            } else {
                if (side === DLSides.FRONT) {
                    fileUploadFrontRef.current?.clear();
                    store.frontSideDL = {} as File;
                    changeContact("dluidfront", "");
                } else {
                    fileUploadBackRef.current?.clear();
                    store.backSideDL = {} as File;
                    changeContact("dluidback", "");
                }
            }

            if (withRequest) {
                const removePromise =
                    type === CO_BUYER
                        ? store.removeImagesDL(side, true)
                        : store.removeImagesDL(side);

                removePromise.then((response) => {
                    if (response?.status === Status.ERROR) {
                        const { error, status } = response as BaseResponseError;
                        toast.current?.show({
                            severity: "error",
                            summary: status,
                            detail: error,
                            life: TOAST_LIFETIME,
                        });
                    } else {
                        toast.current?.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Image deleted successfully",
                            life: TOAST_LIFETIME,
                        });
                    }
                });
            }
        };

        const itemTemplate = (image: File | string, side: DLSide) => {
            const isFilePath = typeof image === "string";
            const alt = isFilePath ? "driven license" : image?.name;
            let src;
            if (type === CO_BUYER) {
                if (side === DLSides.FRONT) {
                    src = store.coBuyerFrontSideDLurl;
                } else {
                    src = store.coBuyerBackSideDLurl;
                }
            } else {
                if (side === DLSides.FRONT) {
                    src = store.frontSideDLurl;
                } else {
                    src = store.backSideDLurl;
                }
            }
            return (
                <div className='flex align-items-center dl-presentation relative'>
                    <Image
                        alt={alt}
                        src={src}
                        role='presentation'
                        preview
                        indicatorIcon={<></>}
                        className='dl-presentation__image'
                    />
                    <Button
                        type='button'
                        icon='pi pi-times'
                        onClick={() => handleDeleteImage(side, isFilePath)}
                        className='p-button dl-presentation__remove-button'
                    />
                </div>
            );
        };

        const chooseTemplate = (
            { chooseButton }: FileUploadHeaderTemplateOptions,
            side: DLSide
        ) => {
            const { size } = side === DLSides.FRONT ? frontSideDL : backSideDL;
            return (
                <div className={`col-6 dl-header ${size ? "dl-header__active" : "mr-1"}`}>
                    {chooseButton}
                </div>
            );
        };

        const emptyTemplate = (side: DLSide) => {
            return (
                <div className='grid upload-empty px-4'>
                    <div className='col-6 flex align-items-center justify-content-center upload-empty__image'>
                        <img
                            alt={`empty ${DLSides.FRONT} DL`}
                            src={side === DLSides.FRONT ? dlFrontImage : dlBackImage}
                        />
                    </div>
                    <div className='col-6 flex align-items-center flex-column'>
                        <img alt='upload icon' src={uploadImage} className='upload-empty__icon' />
                        <span className='text-center dl__upload-icon-label'>
                            Drag and Drop Images Here
                        </span>
                        <div className='col-12 flex justify-content-center align-items-center dl__upload-splitter'>
                            <hr className='dl__line mr-4 flex-1' />
                            <span>or</span>
                            <hr className='dl__line ml-4 flex-1' />
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className='grid address-info row-gap-2'>
                <div className='grid address-info row-gap-2'>
                    <div className='col-3'>
                        <span className='p-float-label'>
                            <Dropdown
                                optionLabel='label'
                                optionValue='id'
                                filter
                                value={
                                    (type === BUYER
                                        ? contactExtData.Buyer_DL_State
                                        : contactExtData.CoBuyer_DL_State) || ""
                                }
                                options={STATES_LIST}
                                onChange={({ target: { value } }) =>
                                    changeContactExtData(
                                        type === BUYER ? "Buyer_DL_State" : "CoBuyer_DL_State",
                                        value
                                    )
                                }
                                className='w-full identification-info__dropdown'
                                disabled={isControlDisabled}
                                showClear={
                                    !!(type === BUYER
                                        ? contactExtData.Buyer_DL_State
                                        : contactExtData.CoBuyer_DL_State)
                                }
                            />
                            <label className='float-label'>DL's State</label>
                        </span>
                    </div>

                    <div className='col-3'>
                        <span className='p-float-label'>
                            <InputText
                                className='identification-info__text-input w-full'
                                value={
                                    type === BUYER
                                        ? contactExtData.Buyer_Driver_License_Num
                                        : contactExtData.CoBuyer_Driver_License_Num
                                }
                                onChange={({ target: { value } }) => {
                                    changeContactExtData(
                                        type === BUYER
                                            ? "Buyer_Driver_License_Num"
                                            : "CoBuyer_Driver_License_Num",
                                        value
                                    );
                                }}
                                disabled={isControlDisabled}
                            />
                            <label className='float-label'>Driver License's Number</label>
                        </span>
                    </div>

                    <div className='col-3 mr-2'>
                        <DateInput
                            name="DL's exp. date"
                            value={
                                (type === BUYER
                                    ? contactExtData.Buyer_DL_Exp_Date
                                    : contactExtData.CoBuyer_DL_Exp_Date) || ""
                            }
                            date={
                                type === BUYER
                                    ? contactExtData.Buyer_DL_Exp_Date
                                    : contactExtData.CoBuyer_DL_Exp_Date
                            }
                            onChange={({ target: { value } }) =>
                                changeContactExtData(
                                    type === BUYER ? "Buyer_DL_Exp_Date" : "CoBuyer_DL_Exp_Date",
                                    Date.parse(String(value))
                                )
                            }
                            className='identification-info__date-input w-full'
                            emptyDate
                            disabled={isControlDisabled}
                        />
                    </div>

                    <div className='col-3'>
                        <span className='p-float-label'>
                            <Dropdown
                                optionLabel='name'
                                optionValue='name'
                                filter
                                value={
                                    (type === BUYER
                                        ? contactExtData.Buyer_Sex
                                        : contactExtData.CoBuyer_Sex) || ""
                                }
                                options={SexList}
                                onChange={({ target: { value } }) =>
                                    changeContactExtData(
                                        type === BUYER ? "Buyer_Sex" : "CoBuyer_Sex",
                                        value
                                    )
                                }
                                className='w-full identification-info__dropdown'
                                disabled={isControlDisabled}
                                showClear={
                                    !!(type === BUYER
                                        ? contactExtData.Buyer_Sex
                                        : contactExtData.CoBuyer_Sex)
                                }
                            />
                            <label className='float-label'>Sex</label>
                        </span>
                    </div>

                    <div className='col-3'>
                        <span className='p-float-label'>
                            <InputMask
                                mask='999-99-9999'
                                className='identification-info__text-input w-full'
                                value={
                                    (type === BUYER
                                        ? contactExtData.Buyer_SS_Number
                                        : contactExtData.CoBuyer_SS_Number) || ""
                                }
                                onChange={({ target: { value } }) => {
                                    changeContactExtData(
                                        type === BUYER ? "Buyer_SS_Number" : "CoBuyer_SS_Number",
                                        String(value)
                                    );
                                }}
                                disabled={isControlDisabled}
                            />
                            <label className='float-label'>Social Security Number</label>
                        </span>
                    </div>

                    <div className='col-3'>
                        <DateInput
                            name='Date of Birth'
                            value={
                                (type === BUYER
                                    ? contactExtData.Buyer_Date_Of_Birth
                                    : contactExtData.CoBuyer_Date_Of_Birth) || ""
                            }
                            date={
                                type === BUYER
                                    ? contactExtData.Buyer_Date_Of_Birth
                                    : contactExtData.CoBuyer_Date_Of_Birth
                            }
                            onChange={({ target: { value } }) =>
                                changeContactExtData(
                                    type === BUYER
                                        ? "Buyer_Date_Of_Birth"
                                        : "CoBuyer_Date_Of_Birth",
                                    Date.parse(String(value))
                                )
                            }
                            className='identification-info__date-input w-full'
                            emptyDate
                            disabled={isControlDisabled}
                        />
                    </div>
                </div>
                {id && !isControlDisabled && (
                    <>
                        <hr className='form-line' />

                        <div
                            className={`col-6 identification-dl ${
                                (type === BUYER ? frontSideDL.size : coBuyerFrontSideDL.size)
                                    ? "identification-dl__active"
                                    : ""
                            }`}
                        >
                            <div className='identification-dl__title'>Frontside</div>
                            {(type === BUYER ? frontSideDLurl : coBuyerFrontSideDLurl) &&
                            isLoading ? (
                                <Loader size='large' />
                            ) : (type === BUYER ? frontSideDLurl : coBuyerFrontSideDLurl) ? (
                                itemTemplate(
                                    type === BUYER ? frontSideDLurl : coBuyerFrontSideDLurl,
                                    DLSides.FRONT
                                )
                            ) : (
                                <FileUpload
                                    ref={
                                        type === BUYER
                                            ? fileUploadFrontRef
                                            : coBuyerFileUploadFrontRef
                                    }
                                    accept='image/*'
                                    headerTemplate={(props) => chooseTemplate(props, DLSides.FRONT)}
                                    chooseLabel='Choose from files'
                                    chooseOptions={{
                                        icon: <></>,
                                    }}
                                    itemTemplate={(file) =>
                                        itemTemplate(file as File, DLSides.FRONT)
                                    }
                                    emptyTemplate={emptyTemplate(DLSides.FRONT)}
                                    onSelect={(event) =>
                                        onTemplateSelect(event, DLSides.FRONT, type === CO_BUYER)
                                    }
                                    progressBarTemplate={<></>}
                                    className='contact-upload'
                                />
                            )}
                        </div>
                        <div
                            className={`col-6 identification-dl ${
                                (type === BUYER ? backSideDL.size : coBuyerBackSideDL.size)
                                    ? "identification-dl__active"
                                    : ""
                            }`}
                        >
                            <div className='identification-dl__title'>Backside</div>
                            {(type === BUYER ? backSideDLurl : coBuyerBackSideDLurl) &&
                            isLoading ? (
                                <Loader size='large' />
                            ) : (type === BUYER ? backSideDLurl : coBuyerBackSideDLurl) ? (
                                itemTemplate(
                                    type === BUYER ? backSideDLurl : coBuyerBackSideDLurl,
                                    DLSides.BACK
                                )
                            ) : (
                                <FileUpload
                                    ref={
                                        type === BUYER
                                            ? fileUploadBackRef
                                            : coBuyerFileUploadBackRef
                                    }
                                    accept='image/*'
                                    headerTemplate={(props) => chooseTemplate(props, DLSides.BACK)}
                                    chooseLabel='Choose from files'
                                    chooseOptions={{
                                        icon: <></>,
                                    }}
                                    itemTemplate={(file) =>
                                        itemTemplate(file as File, DLSides.BACK)
                                    }
                                    emptyTemplate={emptyTemplate(DLSides.BACK)}
                                    onSelect={(event) =>
                                        onTemplateSelect(event, DLSides.BACK, type === CO_BUYER)
                                    }
                                    className='contact-upload'
                                    progressBarTemplate={<></>}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }
);
