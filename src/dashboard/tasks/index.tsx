import { ReactElement, useEffect, useState } from "react";
import { DatatableQueries, initialDataTableQueries } from "common/models/datatable-queries";
import {
    DataTable,
    DataTablePageEvent,
    DataTableSortEvent,
    DataTableValue,
} from "primereact/datatable";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Column } from "primereact/column";
import { QueryParams } from "common/models/query-params";
import { ROWS_PER_PAGE } from "common/settings";
import "./index.css";
import { Loader } from "dashboard/common/loader";
import { observer } from "mobx-react-lite";
import {
    AdvancedSearchDialog,
    SEARCH_FORM_TYPE,
    SearchField,
} from "dashboard/common/dialog/search";
import { useStore } from "store/hooks";
import { Task } from "common/models/tasks";
import { getTasksByUserId } from "http/services/tasks.service";
import { useToast } from "dashboard/common/toast";
import { FilterOptions, filterOptions } from "dashboard/common/filter";
import {
    MultiSelect,
    MultiSelectChangeEvent,
    MultiSelectPanelHeaderTemplateEvent,
} from "primereact/multiselect";
import { TableColumnsList } from "dashboard/tasks/common";
import { Checkbox } from "primereact/checkbox";
import { BorderedCheckbox } from "dashboard/common/form/inputs";
import { AddTaskDialog } from "./add-task-dialog";

const renderColumnsData: TableColumnsList[] = [
    { field: "useruid", header: "Assigned To", checked: true },
    { field: "startdate", header: "Start Date", checked: true },
    { field: "deadline", header: "Due Date", checked: true },
    { field: "phone", header: "Phone number", checked: false },
    { field: "accountuid", header: "Account", checked: true },
    { field: "dealuid", header: "Deal", checked: true },
    { field: "contactuid", header: "Contact", checked: false },
];

enum SEARCH_FORM_FIELDS {
    CREATION_DATE = "Creation Date",
    DESCRIPTION = "Description",
}

enum SEARCH_FORM_QUERY {
    CREATION_DATE = "date",
    DESCRIPTION = "description",
}

interface AdvancedSearch {
    [key: string]: string | number;
    info: string;
    date: string;
}

interface TasksFilterOptions {
    name: string;
    value?: string;
}

const TASKS_STATUS_LIST: TasksFilterOptions[] = [
    { name: "Select all" },
    { name: "Default", value: "0.status" },
    {
        name: "Started",
        value: "1.status",
    },
    {
        name: "In Progress",
        value: "2.status",
    },
    {
        name: "Cancelled",
        value: "3.status",
    },
    {
        name: "Postponed",
        value: "4.status",
    },
    {
        name: "Paused",
        value: "5.status",
    },
    {
        name: "Completed",
        value: "6.status",
    },
    {
        name: "Outdated",
        value: "7.status",
    },
    {
        name: "Deleted",
        value: "8.status",
    },
];

interface TasksDataTableProps {
    onRowClick?: (accountName: string) => void;
    returnedField?: keyof Task;
    getFullInfo?: (account: Task) => void;
}

export const TasksDataTable = observer(
    ({ onRowClick, returnedField, getFullInfo }: TasksDataTableProps): ReactElement => {
        const toast = useToast();
        const userStore = useStore().userStore;
        const [tasks, setTasks] = useState<Task[]>([]);
        const { authUser } = userStore;
        const [totalRecords, setTotalRecords] = useState<number>(0);
        const [globalSearch, setGlobalSearch] = useState<string>("");
        const [lazyState, setLazyState] = useState<DatatableQueries>(initialDataTableQueries);
        const [advancedSearch, setAdvancedSearch] = useState<Record<string, string | number>>({});
        const [dialogVisible, setDialogVisible] = useState<boolean>(false);
        const [isLoading] = useState<boolean>(false);
        const [activeColumns, setActiveColumns] = useState<TableColumnsList[]>(() =>
            renderColumnsData.filter((col) => col.checked)
        );
        const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
        const [myTasksOnly, setMyTasksOnly] = useState<boolean>(false);
        const [selectedFilterOptions, setSelectedFilterOptions] = useState<FilterOptions[]>([]);
        const [selectedFilter, setSelectedFilter] = useState<Pick<FilterOptions, "value">[]>([]);
        const [expandedRows, setExpandedRows] = useState<DataTableValue[]>([]);
        const [showTaskDialog, setShowTaskDialog] = useState<boolean>(false);
        const [currentTask, setCurrentTask] = useState<Task | null>(null);
        const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);

        const handleGetTasks = async (params?: QueryParams) => {
            const responseTotal = await getTasksByUserId(authUser!.useruid, { total: 1 });
            const response = await getTasksByUserId(authUser!.useruid, params);

            if (responseTotal.error || response.error) {
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: responseTotal.error || response.error,
                });
            }
            if (responseTotal && !Array.isArray(responseTotal)) {
                const { total } = responseTotal;
                setTotalRecords(total ?? 0);
            }
            if (response && Array.isArray(response)) {
                setTasks(response);
            }
        };

        useEffect(() => {
            handleGetTasks();
        }, []);

        const searchFields = [
            {
                key: SEARCH_FORM_FIELDS.CREATION_DATE,
                label: SEARCH_FORM_FIELDS.CREATION_DATE,
                value: advancedSearch?.[SEARCH_FORM_FIELDS.CREATION_DATE],
                type: "date",
            },
            {
                key: SEARCH_FORM_FIELDS.DESCRIPTION,
                label: SEARCH_FORM_FIELDS.DESCRIPTION,
                value: advancedSearch?.[SEARCH_FORM_FIELDS.DESCRIPTION],
                type: "text",
            },
        ];

        const pageChanged = (event: DataTablePageEvent) => {
            setLazyState(event);
        };

        const sortData = (event: DataTableSortEvent) => {
            setLazyState(event);
        };
        useEffect(() => {
            const params: QueryParams = {
                ...(globalSearch && { qry: globalSearch }),
                ...(lazyState.sortField && { column: lazyState.sortField }),
                skip: lazyState.first,
                top: lazyState.rows,
            };

            let qry: string = "";
            const selectedFiltersQuery: string = [...selectedStatusFilters]
                .filter((item) => item && item !== "allStatuses")
                .join("+");

            if (selectedFiltersQuery.length) {
                qry += selectedFiltersQuery;
                params.qry = qry;
            }

            handleGetTasks(params);
        }, [lazyState, authUser, globalSearch, selectedStatusFilters]);

        const handleSetAdvancedSearch = (key: keyof AdvancedSearch, value: string | number) => {
            setAdvancedSearch((prevSearch) => {
                const newSearch = { ...prevSearch, [key]: value };
                const isAnyValueEmpty = Object.values(newSearch).every((v) => v === "");
                setButtonDisabled(isAnyValueEmpty);
                return newSearch;
            });
        };

        const handleAdvancedSearch = () => {
            const searchQuery = Object.entries(advancedSearch)
                .filter(([_, value]) => value)
                .map(([key, value]) => {
                    let keyName: string = key;
                    switch (key) {
                        case SEARCH_FORM_FIELDS.CREATION_DATE:
                            keyName = SEARCH_FORM_QUERY.CREATION_DATE;
                            break;

                        case SEARCH_FORM_FIELDS.DESCRIPTION:
                            keyName = SEARCH_FORM_QUERY.DESCRIPTION;
                            value = new Date(value).getTime();
                            break;
                    }
                    return `${value}.${keyName}`;
                })
                .join("+");

            const params: QueryParams = {
                top: lazyState.first,
                skip: lazyState.skip,
                qry: searchQuery,
            };
            authUser && handleGetTasks(params);

            setDialogVisible(false);
        };

        const handleClearAdvancedSearchField = (key: keyof AdvancedSearch) => {
            setAdvancedSearch((prevSearch) => {
                const updatedSearch = { ...prevSearch };
                delete updatedSearch[key];
                return updatedSearch;
            });
        };

        const dropdownFilterHeaderPanel = (evt: MultiSelectPanelHeaderTemplateEvent) => {
            return (
                <div className='dropdown-header flex pb-1'>
                    <label className='cursor-pointer dropdown-header__label'>
                        <Checkbox
                            checked={
                                filterOptions.filter((option) => !option.disabled).length ===
                                selectedFilter.length
                            }
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                setSelectedFilter(
                                    isChecked
                                        ? filterOptions.map((option) => ({ value: option.value }))
                                        : []
                                );
                                setSelectedFilterOptions(
                                    isChecked
                                        ? filterOptions.filter((option) => !option.disabled)
                                        : []
                                );
                            }}
                            className='dropdown-header__checkbox mr-2'
                        />
                        Select All
                    </label>
                    <button
                        className='p-multiselect-close p-link'
                        onClick={(e) => {
                            setSelectedFilter([]);
                            setSelectedFilterOptions([]);
                            evt.onCloseClick(e);
                        }}
                    >
                        <i className='pi pi-times' />
                    </button>
                </div>
            );
        };

        const dropdownHeaderPanel = ({ onCloseClick }: MultiSelectPanelHeaderTemplateEvent) => {
            return (
                <div className='dropdown-header flex pb-1'>
                    <label className='cursor-pointer dropdown-header__label'>
                        <Checkbox
                            onChange={() => {
                                if (renderColumnsData.length === activeColumns.length) {
                                    setActiveColumns(
                                        renderColumnsData.filter(({ checked }) => checked)
                                    );
                                } else {
                                    setActiveColumns(renderColumnsData);
                                }
                            }}
                            checked={renderColumnsData.length === activeColumns.length}
                            className='dropdown-header__checkbox mr-2'
                        />
                        Select All
                    </label>
                    <button
                        className='p-multiselect-close p-link'
                        onClick={(e) => {
                            setActiveColumns(renderColumnsData.filter(({ checked }) => checked));
                            onCloseClick(e);
                        }}
                    >
                        <i className='pi pi-times' />
                    </button>
                </div>
            );
        };

        const handleCreateTask = () => {
            setCurrentTask(null);
            setShowTaskDialog(true);
        };

        const handleEditTask = (task: Task) => {
            setCurrentTask(task);
            setShowTaskDialog(true);
        };

        const handleRowExpansion = (task: Task) => {
            setExpandedRows((prev) =>
                prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
            );
        };

        const rowExpansionTemplate = (task: Task) => {
            return (
                <div className='expanded-row'>
                    <div className='expanded-row__label'>Description: </div>
                    <div className='expanded-row__text'>{task.description || ""}</div>
                </div>
            );
        };

        const filteredTasks = tasks.filter((task) => {
            if (selectedFilterOptions.length === 0) return true;
            return selectedFilterOptions.some((option) => option.value === task.task_status);
        });

        return (
            <div className='card-content tasks'>
                <div className='grid datatable-controls'>
                    <div className='col-6 p-0 flex gap-3'>
                        <span className='p-input-icon-right tasks-search'>
                            <i className='pi pi-search' />
                            <InputText
                                value={globalSearch}
                                placeholder='Search'
                                onChange={(e) => setGlobalSearch(e.target.value)}
                            />
                        </span>
                        <Button
                            className='tasks__search-button'
                            label='Advanced search'
                            severity='success'
                            type='button'
                            onClick={() => setDialogVisible(true)}
                        />

                        <Button
                            severity='success'
                            className='tasks__add-button'
                            type='button'
                            icon='icon adms-add-item'
                            tooltip='Add task'
                            onClick={() => handleCreateTask()}
                        />
                    </div>
                    <div className='col-6 p-0 flex gap-3'>
                        <MultiSelect
                            optionValue='value'
                            optionLabel='name'
                            value={selectedStatusFilters}
                            options={TASKS_STATUS_LIST}
                            onChange={(e) => {
                                e.stopPropagation();
                                setSelectedStatusFilters(e.value);
                            }}
                            placeholder='Filter'
                            className='pb-0 flex align-items-center tasks-filter'
                            display='chip'
                            selectedItemsLabel='Clear Filter'
                            panelHeaderTemplate={dropdownFilterHeaderPanel}
                            pt={{
                                header: {
                                    className: "tasks-filter__header",
                                },
                                wrapper: {
                                    className: "tasks-filter__wrapper",
                                    style: {
                                        maxHeight: "230px",
                                    },
                                },
                            }}
                        />

                        <BorderedCheckbox
                            checked={myTasksOnly}
                            onChange={(e) => {
                                setMyTasksOnly(!!e.target.checked);
                            }}
                            name='My tasks only'
                        />
                        <MultiSelect
                            options={renderColumnsData}
                            value={activeColumns}
                            optionLabel='header'
                            onChange={({ value, stopPropagation }: MultiSelectChangeEvent) => {
                                stopPropagation();
                                setActiveColumns(value);
                            }}
                            panelHeaderTemplate={dropdownHeaderPanel}
                            className='pb-0 h-full flex align-items-center tasks-filter'
                            display='chip'
                            pt={{
                                header: {
                                    className: "tasks-filter__header",
                                },
                                wrapper: {
                                    className: "tasks-filter__wrapper",
                                    style: {
                                        maxHeight: "230px",
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
                <div className='grid'>
                    <div className='col-12'>
                        {isLoading ? (
                            <div className='dashboard-loader__wrapper'>
                                <Loader overlay />
                            </div>
                        ) : (
                            <DataTable
                                showGridlines
                                value={filteredTasks}
                                lazy
                                paginator
                                first={lazyState.first}
                                rows={lazyState.rows}
                                rowsPerPageOptions={ROWS_PER_PAGE}
                                totalRecords={totalRecords}
                                onPage={pageChanged}
                                onSort={sortData}
                                reorderableColumns
                                resizableColumns
                                sortOrder={lazyState.sortOrder}
                                sortField={lazyState.sortField}
                                rowClassName={() => "hover:text-primary cursor-pointer"}
                                expandedRows={expandedRows}
                                onRowToggle={(e: DataTableValue) => setExpandedRows(e.data)}
                                rowExpansionTemplate={rowExpansionTemplate}
                            >
                                <Column
                                    bodyStyle={{ textAlign: "center" }}
                                    reorderable={false}
                                    resizeable={false}
                                    body={(task) => {
                                        return (
                                            <div className={`flex gap-3 align-items-center`}>
                                                <Button
                                                    className='text export-web__icon-button'
                                                    icon='icon adms-edit-item'
                                                    onClick={() => handleEditTask(task)}
                                                />
                                                <Button
                                                    className='text export-web__icon-button'
                                                    icon='pi pi-angle-down'
                                                    onClick={() => handleRowExpansion(task)}
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
                                {activeColumns.map(({ field, header }) => (
                                    <Column
                                        field={field}
                                        header={header}
                                        key={field}
                                        sortable
                                        body={(data) => {
                                            let value: string | number;
                                            value = data[field];

                                            return <div>{value}</div>;
                                        }}
                                        headerClassName='cursor-move'
                                    />
                                ))}
                            </DataTable>
                        )}
                    </div>
                </div>
                <AddTaskDialog
                    visible={showTaskDialog}
                    onHide={() => setShowTaskDialog(false)}
                    currentTask={currentTask as Task}
                    onAction={handleGetTasks}
                    header={currentTask ? "Edit Task" : "Add Task"}
                />
                <AdvancedSearchDialog<AdvancedSearch>
                    visible={dialogVisible}
                    buttonDisabled={buttonDisabled}
                    onHide={() => {
                        setButtonDisabled(true);
                        setDialogVisible(false);
                    }}
                    action={handleAdvancedSearch}
                    onSearchClear={handleClearAdvancedSearchField}
                    onInputChange={handleSetAdvancedSearch}
                    fields={searchFields as SearchField<AdvancedSearch>[]}
                    searchForm={SEARCH_FORM_TYPE.ACCOUNTS}
                />
            </div>
        );
    }
);

export const Tasks = (): ReactElement => {
    return (
        <div className='grid'>
            <div className='col-12'>
                <div className='card'>
                    <div className='card-header'>
                        <h2 className='card-header__title uppercase m-0'>Tasks</h2>
                    </div>
                    <TasksDataTable />
                </div>
            </div>
        </div>
    );
};
