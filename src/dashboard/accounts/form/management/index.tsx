import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Column, ColumnBodyOptions, ColumnProps } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { ReactElement, useEffect, useState } from "react";
import "./index.css";
import { useNavigate, useParams } from "react-router-dom";
import { listAccountActivity } from "http/services/accounts.service";
import { ACCOUNT_ACTIVITY_LIST } from "common/constants/account-options";
import { AccountListActivity } from "common/models/accounts";
import { AccountTakePaymentTabs } from "dashboard/accounts/take-payment-form";
import { SplitButton } from "primereact/splitbutton";
import { AddFeeDialog } from "./add-fee-dialog";
import { ConfirmModal } from "dashboard/common/dialog/confirm";

interface TableColumnProps extends ColumnProps {
    field: keyof AccountListActivity;
}

const renderColumnsData: Pick<TableColumnProps, "header" | "field">[] = [
    { field: "Date", header: "Date" },
    { field: "Description", header: "Description" },
    { field: "Debit", header: "Debit" },
    { field: "Credit", header: "Credit" },
];

enum ModalErrors {
    TITLE_NO_RECEIPT = "Receipt is not Selected!",
    TEXT_NO_PRINT_RECEIPT = "No receipt has been selected for printing. Please select a receipt and try again.",
    TEXT_NO_DOWNLOAD_RECEIPT = "No receipt has been selected for downloading. Please select a receipt and try again.",
}

const quickPayPath = `take-payment?tab=${AccountTakePaymentTabs.QUICK_PAY}`;

export const AccountManagement = (): ReactElement => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activityList, setActivityList] = useState<AccountListActivity[]>([]);
    const [isDialogActive, setIsDialogActive] = useState<boolean>(false);
    const [selectedRows, setSelectedRows] = useState<boolean[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<string>(ACCOUNT_ACTIVITY_LIST[0].name);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [modalTitle, setModalTitle] = useState<string>("");
    const [modalText, setModalText] = useState<string>("");

    const printItems = [
        {
            label: "Print receipt",
            icon: "icon adms-blank",
            command: () => {
                setModalTitle(ModalErrors.TITLE_NO_RECEIPT);
                setModalText(ModalErrors.TEXT_NO_PRINT_RECEIPT);
                setModalVisible(true);
            },
        },
    ];

    const downloadItems = [
        {
            label: "Download receipt",
            icon: "icon adms-blank",
            command: () => {
                setModalTitle(ModalErrors.TITLE_NO_RECEIPT);
                setModalText(ModalErrors.TEXT_NO_DOWNLOAD_RECEIPT);
                setModalVisible(true);
            },
        },
    ];

    useEffect(() => {
        if (id) {
            listAccountActivity(id).then((res) => {
                if (Array.isArray(res) && res.length) {
                    setActivityList(res);
                    setSelectedRows(Array(res.length).fill(false));
                }
            });
        }
    }, [id]);

    const controlColumnHeader = (): ReactElement => (
        <Checkbox
            checked={selectedRows.every((checkbox) => !!checkbox)}
            onClick={({ checked }) => {
                setSelectedRows(selectedRows.map(() => !!checked));
            }}
        />
    );

    const controlColumnBody = (
        _: AccountListActivity,
        { rowIndex }: ColumnBodyOptions
    ): ReactElement => {
        return (
            <div className={`flex gap-3 align-items-center`}>
                <Checkbox
                    checked={selectedRows[rowIndex]}
                    onClick={() => {
                        setSelectedRows(
                            selectedRows.map((state, index) =>
                                index === rowIndex ? !state : state
                            )
                        );
                    }}
                />
            </div>
        );
    };

    return (
        <div className='account-management account-card'>
            <h3 className='account-management__title account-title'>Account Management</h3>
            <div className='grid account__body'>
                <div className='col-12 account__control'>
                    <Dropdown
                        className='account__dropdown'
                        options={ACCOUNT_ACTIVITY_LIST}
                        value={selectedActivity}
                        onChange={({ target: { value } }) => setSelectedActivity(value)}
                        optionValue='name'
                        optionLabel='name'
                    />
                    <Button
                        className='account-management__button ml-auto'
                        label='Add Fee'
                        onClick={() => setIsDialogActive(true)}
                        outlined
                    />
                    <Button
                        className='account-management__button'
                        label='Take Payment'
                        outlined
                        onClick={() => navigate(quickPayPath)}
                    />
                </div>
                <div className='col-12 account__table'>
                    <DataTable
                        showGridlines
                        value={activityList}
                        emptyMessage='No activity yet.'
                        reorderableColumns
                        resizableColumns
                        scrollable
                    >
                        <Column
                            bodyStyle={{ textAlign: "center" }}
                            header={controlColumnHeader}
                            reorderable={false}
                            resizeable={false}
                            body={controlColumnBody}
                            pt={{
                                root: {
                                    style: {
                                        width: "60px",
                                    },
                                },
                            }}
                        />
                        {renderColumnsData.map(({ field, header }) => (
                            <Column
                                field={field}
                                header={header}
                                alignHeader={"left"}
                                key={field}
                                headerClassName='cursor-move'
                                body={(data, { rowIndex }) => {
                                    return (
                                        <div
                                            className={`${
                                                selectedRows[rowIndex] && "row--selected"
                                            }`}
                                        >
                                            {data[field]}
                                        </div>
                                    );
                                }}
                                className='max-w-16rem overflow-hidden text-overflow-ellipsis'
                            />
                        ))}
                    </DataTable>
                </div>
                {!!activityList.length && (
                    <div className='col-12 flex gap-3 align-items-end justify-content-start account-management__actions'>
                        <SplitButton
                            model={printItems}
                            className='account__split-button'
                            label='Print'
                            icon='pi pi-table'
                            tooltip='Print table'
                            tooltipOptions={{
                                position: "bottom",
                            }}
                            onClick={() => {
                                setModalVisible(true);
                                setModalTitle(ModalErrors.TITLE_NO_RECEIPT);
                                setModalText(ModalErrors.TEXT_NO_PRINT_RECEIPT);
                            }}
                            outlined
                        />
                        <SplitButton
                            model={downloadItems}
                            className='account__split-button'
                            label='Download'
                            icon='pi pi-table'
                            tooltip='Download table'
                            tooltipOptions={{
                                position: "bottom",
                            }}
                            onClick={() => {
                                setModalVisible(true);
                                setModalTitle(ModalErrors.TITLE_NO_RECEIPT);
                                setModalText(ModalErrors.TEXT_NO_DOWNLOAD_RECEIPT);
                            }}
                            outlined
                        />
                    </div>
                )}
            </div>
            <ConfirmModal
                visible={!!modalVisible}
                title={modalTitle}
                icon='pi-exclamation-triangle'
                bodyMessage={modalText}
                confirmAction={() => setModalVisible(false)}
                draggable={false}
                acceptLabel='Got It'
                className='account-warning'
                onHide={() => setModalVisible(false)}
            />
            <AddFeeDialog visible={isDialogActive} onHide={() => setIsDialogActive(false)} />
        </div>
    );
};
