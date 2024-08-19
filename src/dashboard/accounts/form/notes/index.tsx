import { InputTextarea } from "primereact/inputtextarea";
import { ReactElement, useEffect, useState } from "react";

import "./index.css";
import { Button } from "primereact/button";
import { DataTable, DataTableRowClickEvent, DataTableValue } from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import {
    getAccountNote,
    listAccountNotes,
    updateAccountNote,
} from "http/services/accounts.service";
import { useParams } from "react-router-dom";
import { AccountMemoNote, AccountNote } from "common/models/accounts";
import { AddNoteDialog } from "./add-note-dialog";
import { useToast } from "dashboard/common/toast";
import { Status } from "common/models/base-response";
import { TOAST_LIFETIME } from "common/settings";

interface TableColumnProps extends ColumnProps {
    field: keyof AccountNote;
}

const renderColumnsData: Pick<TableColumnProps, "header" | "field">[] = [
    { field: "Date", header: "Date" },
    { field: "NoteBy", header: "Note Taker" },
    { field: "ContactMethod", header: "Contact Type" },
];

type Note = Pick<AccountMemoNote, "message" | "note">;

const initialNote: Note = {
    message: "",
    note: "",
};

export const AccountNotes = (): ReactElement => {
    const { id } = useParams();
    const toast = useToast();
    const [notesList, setNotesList] = useState<AccountNote[]>([]);
    const [expandedRows, setExpandedRows] = useState<DataTableValue[]>([]);
    const [dialogShow, setDialogShow] = useState<boolean>(false);
    const [note, setNote] = useState<Note>(initialNote);

    const handleGetNotes = () => {
        listAccountNotes(id!).then((res) => {
            if (Array.isArray(res) && res.length) setNotesList(res);
        });
    };

    useEffect(() => {
        if (id) {
            handleGetNotes();
            handleGetNote();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleDeleteNote = ({ itemuid }: AccountNote) => {
        // TODO: add API call to delete
        setNotesList(notesList.filter((item) => item.itemuid !== itemuid));
    };

    const rowExpansionTemplate = (data: AccountNote) => {
        return (
            <div className='expanded-row'>
                <div className='expanded-row__label'>Note: </div>
                <div className='expanded-row__text'>{data.Note || ""}</div>
            </div>
        );
    };

    const handleRowExpansionClick = (data: AccountNote) => {
        if (expandedRows.includes(data)) {
            setExpandedRows(expandedRows.filter((item) => item !== data));
            return;
        }
        setExpandedRows([...expandedRows, data]);
    };

    const handleGetNote = () => {
        getAccountNote(id!).then((res) => {
            setNote(res as AccountMemoNote);
        });
    };

    const handleSaveNote = (saveItem: keyof Note) => {
        id &&
            updateAccountNote(id, { [saveItem]: note[saveItem] }).then((res) => {
                if (res?.status === Status.ERROR) {
                    toast.current?.show({
                        severity: "error",
                        summary: Status.ERROR,
                        detail: res.error,
                        life: TOAST_LIFETIME,
                    });
                }
            });
    };

    return (
        <div className='account-notes account-card'>
            <h3 className='account-notes__title account-title'>Notes</h3>
            <div className='grid account__body'>
                <div className='col-12 account__control'>
                    <div className='account-note'>
                        <span className='p-float-label'>
                            <InputTextarea
                                id='account-memo'
                                value={note.note}
                                onChange={(e) => setNote({ ...note, note: e.target.value })}
                                className='account-note__input'
                            />
                            <label htmlFor='account-memo'>Account Memo</label>
                        </span>
                        <Button
                            severity='secondary'
                            className='account-note__button'
                            label='Save'
                            onClick={() => handleSaveNote("note")}
                        />
                    </div>
                    <div className='account-note'>
                        <span className='p-float-label'>
                            <InputTextarea
                                id='account-payment'
                                value={note.message}
                                onChange={(e) => setNote({ ...note, message: e.target.value })}
                                className='account-note__input'
                            />
                            <label htmlFor='account-payment'>Payment Alert</label>
                        </span>
                        <Button
                            severity='secondary'
                            className='account-note__button'
                            label='Save'
                            onClick={() => handleSaveNote("message")}
                        />
                    </div>
                </div>
                <div className='col-12 mt-5 flex justify-content-end'>
                    <Button className='account-notes__button' onClick={() => setDialogShow(true)}>
                        Add Note
                    </Button>
                </div>
                <div className='col-12 account__table'>
                    <DataTable
                        showGridlines
                        value={notesList}
                        emptyMessage='No notes added yet.'
                        reorderableColumns
                        resizableColumns
                        scrollable
                        rowExpansionTemplate={rowExpansionTemplate}
                        expandedRows={expandedRows}
                        onRowToggle={(e: DataTableRowClickEvent) => setExpandedRows([e.data])}
                    >
                        <Column
                            bodyStyle={{ textAlign: "center" }}
                            reorderable={false}
                            resizeable={false}
                            body={(options) => {
                                return (
                                    <div className={`flex gap-3 align-items-center `}>
                                        <Button
                                            className='text account-notes__table-button'
                                            icon='icon adms-edit-item'
                                        />
                                        <Button
                                            className='text export-web__icon-button'
                                            icon='pi pi-angle-down'
                                            onClick={() => handleRowExpansionClick(options)}
                                        />
                                    </div>
                                );
                            }}
                            pt={{
                                root: {
                                    style: {
                                        width: "100px",
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
                                className='max-w-16rem overflow-hidden text-overflow-ellipsis'
                            />
                        ))}
                        <Column
                            bodyStyle={{ textAlign: "center" }}
                            reorderable={false}
                            resizeable={false}
                            body={(options) => {
                                return (
                                    <div className={`flex gap-3 align-items-center `}>
                                        <Button
                                            outlined
                                            tooltip='Delete note'
                                            className='account-notes__delete-button'
                                            icon='icon adms-trash-can'
                                            text
                                            onClick={() => handleDeleteNote(options)}
                                        />
                                    </div>
                                );
                            }}
                            pt={{
                                root: {
                                    style: {
                                        width: "40px",
                                        borderLeft: "none",
                                    },
                                },
                            }}
                        />
                    </DataTable>
                </div>
                {!!notesList.length && (
                    <div className='col-12 flex gap-3'>
                        <Button className='account-notes__button'>Print</Button>
                        <Button className='account-notes__button'>Download</Button>
                    </div>
                )}
            </div>
            <AddNoteDialog
                action={handleGetNotes}
                visible={dialogShow}
                accountuid={id}
                onHide={() => setDialogShow(false)}
            />
        </div>
    );
};
