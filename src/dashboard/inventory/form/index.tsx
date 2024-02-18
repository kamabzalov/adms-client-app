/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Steps } from "primereact/steps";
import { Suspense, useEffect, useState } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { InventoryVehicleData } from "./vehicle";
import { Button } from "primereact/button";
import { InventoryItem, InventorySection } from "../common";
import { InventoryPurchaseData } from "./purchase";
import { InventoryMediaData } from "./media-data";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "store/hooks";
import { ProgressBar } from "primereact/progressbar";
import { ConfirmModal } from "dashboard/common/dialog/confirm";
import { deleteInventory, getInventoryDeleteReasonsList } from "http/services/inventory-service";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InventoryExportWebData } from "./export-web";
import { AuthUser } from "http/services/auth.service";
import { getKeyValue } from "services/local-storage.service";
import { LS_APP_USER } from "common/constants/localStorage";

import { useLocation } from "react-router-dom";

export const inventorySections = [
    InventoryVehicleData,
    InventoryPurchaseData,
    InventoryMediaData,
    InventoryExportWebData,
].map((sectionData) => new InventorySection(sectionData));

const ACCORDION_STEPS = inventorySections.map((item) => item.startIndex);
const ITEMS_MENU_COUNT = inventorySections.reduce((acc, current) => acc + current.getLength(), -1);
const DELETE_ACTIVE_INDEX = ITEMS_MENU_COUNT + 1;
const STEP = "step";

export const InventoryForm = () => {
    const { id } = useParams();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const tabParam = Number(searchParams.get(STEP));
    const [stepActiveIndex, setStepActiveIndex] = useState<number>(tabParam);
    const [accordionActiveIndex, setAccordionActiveIndex] = useState<number | number[]>([0]);
    const [confirmActive, setConfirmActive] = useState<boolean>(false);
    const [reason, setReason] = useState<string>("");
    const [comment, setComment] = useState<string>("");
    const store = useStore().inventoryStore;
    const { getInventory, clearInventory, saveInventory } = store;
    const navigate = useNavigate();
    const [deleteReasonsList, setDeleteReasonsList] = useState<string[]>([]);

    useEffect(() => {
        const authUser: AuthUser = getKeyValue(LS_APP_USER);
        if (authUser) {
            getInventoryDeleteReasonsList(authUser.useruid).then((res) => {
                Array.isArray(res) && setDeleteReasonsList(res);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (id) {
            getInventory(id);
        } else {
            clearInventory();
        }
        return () => {
            clearInventory();
        };
    }, [id, store]);

    useEffect(() => {
        ACCORDION_STEPS.forEach((step, index) => {
            if (step - 1 < stepActiveIndex) {
                return setAccordionActiveIndex((prev) => {
                    const updatedArray = Array.isArray(prev) ? [...prev] : [0];
                    updatedArray[index] = index;
                    return updatedArray;
                });
            }
        });
    }, [stepActiveIndex]);

    const handleSave = () => {
        saveInventory().then((res) => {
            //TODO: add actions after saving
            if (res && !id) {
                navigate(`/dashboard/inventory`);
            }
        });
    };

    const handleDeleteInventory = () => {
        id &&
            deleteInventory(id, { reason, comment }).then(
                (response) => response && navigate("/dashboard/inventory")
            );
    };

    return (
        <Suspense>
            <div className='grid'>
                <div className='col-12'>
                    <div className='card inventory'>
                        <div className='card-header'>
                            <h2 className='card-header__title uppercase m-0'>
                                {id ? "Edit" : "Create new"} inventory
                            </h2>
                        </div>
                        <div className='card-content inventory__card'>
                            <div className='grid flex-nowrap'>
                                <div className='p-0'>
                                    <Accordion
                                        activeIndex={accordionActiveIndex}
                                        onTabChange={(e) => setAccordionActiveIndex(e.index)}
                                        className='inventory__accordion'
                                        multiple
                                    >
                                        {inventorySections.map((section) => (
                                            <AccordionTab
                                                key={section.sectionId}
                                                header={section.label}
                                            >
                                                <Steps
                                                    readOnly={false}
                                                    activeIndex={
                                                        stepActiveIndex - section.startIndex
                                                    }
                                                    onSelect={(e) => {
                                                        setStepActiveIndex(
                                                            e.index + section.startIndex
                                                        );
                                                    }}
                                                    model={section.items.map(
                                                        ({ itemLabel, template }, idx) => ({
                                                            label: itemLabel,
                                                            template,
                                                            command: () => {
                                                                navigate(
                                                                    `/dashboard/inventory/${id}?${STEP}=${
                                                                        section.startIndex + idx
                                                                    }`
                                                                );
                                                            },
                                                        })
                                                    )}
                                                    className='vertical-step-menu'
                                                    pt={{
                                                        menu: { className: "flex-column w-full" },
                                                        step: {
                                                            className:
                                                                "border-circle inventory-step",
                                                        },
                                                    }}
                                                />
                                            </AccordionTab>
                                        ))}
                                    </Accordion>
                                    {id && (
                                        <Button
                                            icon='pi pi-times'
                                            className='p-button gap-2 inventory__delete-nav w-full'
                                            severity='danger'
                                            onClick={() => setStepActiveIndex(DELETE_ACTIVE_INDEX)}
                                        >
                                            Delete inventory
                                        </Button>
                                    )}
                                </div>
                                <div className='w-full flex flex-column p-0'>
                                    <div className='flex flex-grow-1'>
                                        {inventorySections.map((section) =>
                                            section.items.map((item: InventoryItem) => (
                                                <div
                                                    key={item.itemIndex}
                                                    className={`${
                                                        stepActiveIndex === item.itemIndex
                                                            ? "block inventory-form"
                                                            : "hidden"
                                                    }`}
                                                >
                                                    <div className='inventory-form__title uppercase'>
                                                        {item.itemLabel}
                                                    </div>
                                                    {stepActiveIndex === item.itemIndex && (
                                                        <Suspense
                                                            fallback={
                                                                <ProgressBar
                                                                    mode='indeterminate'
                                                                    style={{ height: "8px" }}
                                                                    color='var(--admss-app-main-blue)'
                                                                />
                                                            }
                                                        >
                                                            {item.component}
                                                        </Suspense>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        {stepActiveIndex === DELETE_ACTIVE_INDEX && (
                                            <div className='inventory-form'>
                                                <div className='inventory-form__title inventory-form__title--danger uppercase'>
                                                    Delete inventory
                                                </div>
                                                <div className='grid'>
                                                    <div className='col-6'>
                                                        <Dropdown
                                                            optionLabel='name'
                                                            optionValue='name'
                                                            value={reason}
                                                            required
                                                            filter
                                                            onChange={({ value }) => {
                                                                setReason(value);
                                                            }}
                                                            options={deleteReasonsList}
                                                            placeholder='Reason'
                                                            className='w-full vehicle-general__dropdown'
                                                        />
                                                    </div>
                                                    <div className='col-12'>
                                                        <span className='p-float-label'>
                                                            <InputTextarea
                                                                className='w-full'
                                                                value={comment}
                                                                pt={{
                                                                    root: {
                                                                        style: {
                                                                            height: "110px",
                                                                        },
                                                                    },
                                                                }}
                                                                onChange={({
                                                                    target: { value },
                                                                }) => {
                                                                    setComment(value);
                                                                }}
                                                            />
                                                            <label className='float-label'>
                                                                Comment
                                                            </label>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className='flex justify-content-end gap-3 mt-5 mr-3'>
                                <Button
                                    onClick={() => setStepActiveIndex((prev) => --prev)}
                                    disabled={!stepActiveIndex}
                                    className='uppercase px-6 inventory__button'
                                    outlined
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={() => setStepActiveIndex((prev) => ++prev)}
                                    disabled={stepActiveIndex >= ITEMS_MENU_COUNT}
                                    severity={
                                        stepActiveIndex === DELETE_ACTIVE_INDEX
                                            ? "secondary"
                                            : "success"
                                    }
                                    className='uppercase px-6 inventory__button'
                                    outlined
                                >
                                    Next
                                </Button>
                                {stepActiveIndex === DELETE_ACTIVE_INDEX ? (
                                    <Button
                                        onClick={() => setConfirmActive(true)}
                                        className='p-button uppercase px-6 inventory__button inventory__button--danger'
                                    >
                                        Delete
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSave}
                                        className='uppercase px-6 inventory__button'
                                    >
                                        Save
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmModal
                visible={confirmActive}
                bodyMessage='Do you really want to delete this inventory? 
                This process cannot be undone.'
                confirmAction={handleDeleteInventory}
                onHide={() => setConfirmActive(false)}
            />
        </Suspense>
    );
};
