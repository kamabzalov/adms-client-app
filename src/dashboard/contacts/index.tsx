import { useEffect, useState } from "react";
import {
    getContacts,
    getContactsAmount,
    getContactsCategories,
} from "http/services/contacts-service";
import { AuthUser } from "http/services/auth.service";
import {
    DataTable,
    DataTablePageEvent,
    DataTableRowClickEvent,
    DataTableSortEvent,
} from "primereact/datatable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getKeyValue } from "services/local-storage.service";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Column, ColumnProps } from "primereact/column";
import { QueryParams } from "common/models/query-params";
import { DatatableQueries, initialDataTableQueries } from "common/models/datatable-queries";
import { LS_APP_USER } from "common/constants/localStorage";
import { useNavigate } from "react-router-dom";
import "./index.css";
import { ROWS_PER_PAGE } from "common/settings";
import { ContactType, ContactUser } from "common/models/contact";
import { ContactsUserSettings, ServerUserSettings, TableState } from "common/models/user";
import { getUserSettings, setUserSettings } from "http/services/auth-user.service";

interface TableColumnProps extends ColumnProps {
    field: keyof ContactUser;
}

interface ContactsDataTableProps {
    onRowClick?: (companyName: string) => void;
}

const renderColumnsData: TableColumnProps[] = [
    { field: "userName", header: "Name" },
    { field: "phone1", header: "Work Phone" },
    { field: "phone2", header: "Home Phone" },
    { field: "streetAddress", header: "Address" },
    { field: "email1", header: "Email" },
    { field: "created", header: "Created" },
];

export const ContactsDataTable = ({ onRowClick }: ContactsDataTableProps) => {
    const [categories, setCategories] = useState<ContactType[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ContactType | null>(null);
    const [authUser, setUser] = useState<AuthUser | null>(null);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [globalSearch, setGlobalSearch] = useState<string>("");
    const [contacts, setUserContacts] = useState<ContactUser[]>([]);
    const [lazyState, setLazyState] = useState<DatatableQueries>(initialDataTableQueries);
    const [serverSettings, setServerSettings] = useState<ServerUserSettings>();
    const [activeColumns, setActiveColumns] = useState<TableColumnProps[]>(renderColumnsData);
    const navigate = useNavigate();

    const printTableData = () => {
        const contactsDoc = new jsPDF();
        autoTable(contactsDoc, { html: ".p-datatable-table" });
        contactsDoc.output("dataurlnewwindow");
    };

    const pageChanged = (event: DataTablePageEvent) => {
        setLazyState(event);
        changeSettings({ table: event as TableState });
    };

    const sortData = (event: DataTableSortEvent) => {
        setLazyState(event);
        changeSettings({ table: event as TableState });
    };

    useEffect(() => {
        const authUser: AuthUser = getKeyValue(LS_APP_USER);
        if (authUser) {
            setUser(authUser);
            getContactsCategories().then((response) => {
                if (response?.contact_types.length) {
                    setCategories(response?.contact_types);
                }
            });
            getContactsAmount(authUser.useruid, { total: 1 }).then((response) => {
                setTotalRecords(response?.total ?? 0);
            });
        }
    }, []);

    useEffect(() => {
        const params: QueryParams = {
            ...(selectedCategory?.id && { param: selectedCategory.id }),
            ...(lazyState.sortOrder === 1 && { type: "asc" }),
            ...(lazyState.sortOrder === -1 && { type: "desc" }),
            ...(globalSearch && { qry: globalSearch }),
            ...(lazyState.sortField && { column: lazyState.sortField }),
            skip: lazyState.first,
            top: lazyState.rows,
        };
        if (authUser) {
            getContacts(authUser.useruid, params).then((response) => {
                if (response?.length) {
                    setUserContacts(response);
                } else {
                    setUserContacts([]);
                }
            });
        }
    }, [selectedCategory, lazyState, authUser, globalSearch]);

    useEffect(() => {
        if (authUser) {
            getUserSettings(authUser.useruid).then((response) => {
                if (response?.profile.length) {
                    const allSettings: ServerUserSettings = JSON.parse(response.profile);
                    setServerSettings(allSettings);
                    const { contacts: settings } = allSettings;
                    settings?.activeColumns &&
                        setActiveColumns(settings.activeColumns as TableColumnProps[]);
                    settings?.table &&
                        setLazyState({
                            first: settings.table.first || initialDataTableQueries.first,
                            rows: settings.table.rows || initialDataTableQueries.rows,
                            page: settings.table.page || initialDataTableQueries.page,
                            column: settings.table.column || initialDataTableQueries.column,
                            sortField:
                                settings.table.sortField || initialDataTableQueries.sortField,
                            sortOrder:
                                settings.table.sortOrder || initialDataTableQueries.sortOrder,
                        });
                }
            });
        }
    }, [authUser]);

    const changeSettings = (settings: Partial<ContactsUserSettings>) => {
        if (authUser) {
            const newSettings = {
                ...serverSettings,
                contacts: { ...serverSettings?.contacts, ...settings },
            } as ServerUserSettings;
            setServerSettings(newSettings);
            setUserSettings(authUser.useruid, newSettings);
        }
    };

    const handleOnRowClick = ({ data: { contactuid, companyName } }: DataTableRowClickEvent) => {
        if (onRowClick) {
            onRowClick(companyName);
        } else {
            navigate(contactuid);
        }
    };

    return (
        <div className='card-content'>
            <div className='grid datatable-controls'>
                <div className='col-6'>
                    <div className='contact-top-controls'>
                        <Dropdown
                            value={selectedCategory}
                            onChange={(e) => {
                                changeSettings({
                                    selectedCategoriesOptions: e.value,
                                });
                                setSelectedCategory(e.value);
                            }}
                            options={categories}
                            optionLabel='name'
                            editable
                            className='m-r-20px'
                            placeholder='Select Category'
                        />
                        <Button
                            className='contact-top-controls__button m-r-20px'
                            icon='pi pi-plus-circle'
                            severity='success'
                            type='button'
                            onClick={() => navigate("create")}
                        />
                        <Button
                            severity='success'
                            type='button'
                            icon='pi pi-print'
                            onClick={printTableData}
                        />
                    </div>
                </div>
                <div className='col-6 text-right'>
                    <Button
                        className='contact-top-controls__button m-r-20px'
                        label='Advanced search'
                        severity='success'
                        type='button'
                    />
                    <span className='p-input-icon-right'>
                        <i className='pi pi-search' />
                        <InputText
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                        />
                    </span>
                </div>
            </div>
            <div className='grid'>
                <div className='col-12'>
                    <DataTable
                        showGridlines
                        value={contacts}
                        lazy
                        scrollable
                        scrollHeight='70vh'
                        paginator
                        first={lazyState.first}
                        rows={lazyState.rows}
                        rowsPerPageOptions={ROWS_PER_PAGE}
                        totalRecords={totalRecords}
                        onPage={pageChanged}
                        onSort={sortData}
                        sortOrder={lazyState.sortOrder}
                        sortField={lazyState.sortField}
                        resizableColumns
                        reorderableColumns
                        rowClassName={() => "hover:text-primary cursor-pointer"}
                        onRowClick={handleOnRowClick}
                        onColReorder={(event) => {
                            if (authUser && Array.isArray(event.columns)) {
                                const orderArray = event.columns?.map(
                                    (column: any) => column.props.field
                                );

                                const newActiveColumns = orderArray
                                    .map((field: string) => {
                                        return (
                                            activeColumns.find(
                                                (column) => column.field === field
                                            ) || null
                                        );
                                    })
                                    .filter(
                                        (column): column is TableColumnProps => column !== null
                                    ) as TableColumnProps[];

                                setActiveColumns(newActiveColumns);

                                changeSettings({
                                    activeColumns: newActiveColumns,
                                });
                            }
                        }}
                        onColumnResizeEnd={(event) => {
                            if (authUser && event) {
                                const newColumnWidth = {
                                    [event.column.props.field as string]: event.element.offsetWidth,
                                };
                                changeSettings({
                                    columnWidth: {
                                        ...serverSettings?.contacts?.columnWidth,
                                        ...newColumnWidth,
                                    },
                                });
                            }
                        }}
                        pt={{
                            table: {
                                style: {
                                    tableLayout: "fixed",
                                },
                            },
                        }}
                    >
                        {activeColumns.map(({ field, header }) => (
                            <Column
                                field={field}
                                header={header}
                                key={field}
                                sortable
                                headerClassName='cursor-move'
                                pt={{
                                    root: {
                                        style: {
                                            width: serverSettings?.contacts?.columnWidth?.[field],
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        },
                                    },
                                }}
                            />
                        ))}
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default function Contacts() {
    return (
        <div className='grid'>
            <div className='col-12'>
                <div className='card'>
                    <div className='card-header'>
                        <h2 className='card-header__title uppercase m-0'>Contacts</h2>
                    </div>
                    <ContactsDataTable />
                </div>
            </div>
        </div>
    );
}
