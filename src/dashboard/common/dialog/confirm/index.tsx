import { useEffect, useRef } from "react";
import { ConfirmDialog, ConfirmDialogProps, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import "./index.css";

interface ConfirmModalProps extends ConfirmDialogProps {
    bodyMessage?: string;
    confirmAction?: () => void;
}

export const ConfirmModal = ({
    bodyMessage,
    confirmAction,
    visible,
    onHide,
    ...props
}: ConfirmModalProps) => {
    const toast = useRef<Toast>(null);

    useEffect(() => {
        visible && showTemplate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const accept = () => {
        confirmAction && confirmAction();
        toast.current &&
            toast.current.show({
                severity: "info",
                summary: "Confirmed",
                detail: "You have accepted",
                life: 3000,
            });
    };

    const reject = () => {
        toast.current &&
            toast.current.show({
                severity: "warn",
                summary: "Rejected",
                detail: "You have rejected",
                life: 3000,
            });
    };

    const showTemplate = () => {
        confirmDialog({
            header: (
                <div className='confirm-header'>
                    <i className='pi pi-times-circle confirm-header__icon' />
                    <div className='confirm-header__title'>Are you sure?</div>
                </div>
            ),
            message: (
                <div className='text-center w-full confirm-body'>
                    {bodyMessage || "Please confirm to proceed moving forward."}
                </div>
            ),
            ...props,
            accept,
            reject,
            onHide,
        });
    };

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
        </>
    );
};
