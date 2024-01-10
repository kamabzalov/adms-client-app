import { DashboardDialog } from "dashboard/common/dialog";
import { DialogProps } from "primereact/dialog";
import "./index.css";
import { useEffect, useState } from "react";
import { DataTable, DataTableExpandedRows, DataTableRowClickEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { SupportHistory, getSupportMessages } from "http/services/support.service";
import { LS_APP_USER } from "common/constants/localStorage";
import { AuthUser } from "http/services/auth.service";
import { getKeyValue } from "services/local-storage.service";

interface SupportContactDialogProps extends DialogProps {
    useruid: string;
}

export const SupportHistoryDialog = ({
    visible,
    onHide,
    useruid,
}: SupportContactDialogProps): JSX.Element => {
    const [supportHistoryData, setSupportHistoryData] = useState<SupportHistory[]>([]);
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows[]>([]);

    useEffect(() => {
        const authUser: AuthUser = getKeyValue(LS_APP_USER);
        if (authUser && visible) {
            getSupportMessages(useruid).then((response) => {
                response && setSupportHistoryData(response);
            });
        }
    }, [useruid, visible]);

    const rowExpansionTemplate = (data: SupportHistory) => {
        return <div className='datatable-hidden'>{data.message}</div>;
    };

    const handleRowClick = (e: DataTableRowClickEvent) => {
        setExpandedRows([e.data]);
    };

    return (
        <DashboardDialog
            className='dialog__contact-support history-support'
            header='Support history'
            visible={visible}
            onHide={onHide}
        >
            <DataTable
                value={supportHistoryData}
                rowExpansionTemplate={rowExpansionTemplate}
                expandedRows={expandedRows}
                onRowToggle={(e: DataTableRowClickEvent) => setExpandedRows([e.data])}
                onRowClick={handleRowClick}
                rowHover
            >
                <Column header='From' field='username' />
                <Column header='Theme' field='topic' />
                <Column header='Date' field='created' />
            </DataTable>
        </DashboardDialog>
    );
};
