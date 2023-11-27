import { Dialog, DialogProps } from "primereact/dialog";
import "./index.css";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { useEffect, useState } from "react";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Task, TaskUser, createTask, getTasksUserList } from "http/services/tasks.service";
import { AuthUser } from "http/services/auth.service";
import { getKeyValue } from "services/local-storage.service";

const DialogIcon = ({ icon }: { icon: "search" | string }) => {
    return (
        <span className='p-inputgroup-addon'>
            <i className={`admss-icon-${icon}`} />
        </span>
    );
};

interface AddTaskDialogProps extends DialogProps {
    currentTask?: Task;
}

export const AddTaskDialog = ({ visible, onHide, header, currentTask }: AddTaskDialogProps) => {
    const [assignTo, setAssignTo] = useState<string>(currentTask?.accountuid || "");
    const [startDate, setStartDate] = useState<Date | null>((currentTask?.created as any) || null);
    const [dueDate, setDueDate] = useState<Date | null>((currentTask?.deadline as any) || null);
    const [account, setAccount] = useState<string>(currentTask?.accountname || "");
    const [deal, setDeal] = useState<string>(currentTask?.dealname || "");
    const [contact, setContact] = useState<string>(currentTask?.contactname || "");
    const [phoneNumber, setPhoneNumber] = useState<string>(currentTask?.phone || "");
    const [description, setDescription] = useState<string>(currentTask?.description || "");
    const [assignToData, setAssignToData] = useState<TaskUser[] | null>(null);

    useEffect(() => {
        const authUser: AuthUser = getKeyValue("admss-client-app-user");
        if (authUser) {
            getTasksUserList(authUser.useruid).then((response) => {
                if (response) setAssignToData(response);
            });
        }
    }, []);

    const handleSaveTaskData = () => {
        const taskData: any = {
            assignTo,
            startDate,
            dueDate,
            account,
            deal,
            contact,
            phoneNumber,
            description,
        };

        createTask(taskData).then((response) => {
            // eslint-disable-next-line no-console
        });
        onHide();
    };

    return (
        <Dialog
            header={header}
            className='dialog dialog__add-task'
            visible={visible}
            onHide={onHide}
        >
            <div className='flex flex-column row-gap-3 p-4'>
                {assignToData && (
                    <Dropdown
                        placeholder='Assign to'
                        value={assignTo}
                        options={assignToData}
                        optionLabel={"username"}
                        className='flex align-items-center'
                        onChange={(e) => setAssignTo(e.value)}
                    />
                )}
                <div className='flex flex-column md:flex-row column-gap-3'>
                    <div className='p-inputgroup flex-1'>
                        <Calendar
                            placeholder='Start Date'
                            value={startDate}
                            onChange={(e) => setStartDate(e.value as Date)}
                        />
                        <DialogIcon icon='support-history' />
                    </div>
                    <div className='p-inputgroup flex-1'>
                        <Calendar
                            placeholder='Due Date'
                            value={dueDate}
                            onChange={(e) => setDueDate(e.value as Date)}
                        />
                        <DialogIcon icon='support-history' />
                    </div>
                </div>
                <div className='p-inputgroup flex-1'>
                    <InputText
                        placeholder='Account'
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                    />
                    <DialogIcon icon='search' />
                </div>
                <div className='p-inputgroup flex-1'>
                    <InputText
                        placeholder='Deal'
                        value={deal}
                        onChange={(e) => setDeal(e.target.value)}
                    />
                    <DialogIcon icon='search' />
                </div>
                <div className='p-inputgroup flex-1'>
                    <InputText
                        placeholder='Contact'
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                    />
                    <DialogIcon icon='search' />
                </div>
                <InputText
                    placeholder='Phone Number'
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <InputTextarea
                    placeholder='Description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='h-8rem'
                />
            </div>

            <div className='p-dialog-footer flex justify-content-center'>
                <Button label='Save' onClick={handleSaveTaskData} />
            </div>
        </Dialog>
    );
};
