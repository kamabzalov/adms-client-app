import { useEffect, useRef } from "react";
import { ConfirmDialog, ConfirmDialogProps, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import "./index.css";

interface ConfirmModalProps extends ConfirmDialogProps {
    bodyMessage?: string;
    title?: string;
    icon?: string;
    confirmAction?: () => void;
    visible: boolean;
    onHide: () => void;
}

export const ConfirmModal = ({
    bodyMessage,
    confirmAction,
    title,
    visible,
    onHide,
    icon,
    ...props
}: ConfirmModalProps) => {
    const toast = useRef<Toast>(null);

    useEffect(() => {
        visible && showTemplate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const accept = () => {
        confirmAction && confirmAction();
        onHide();
    };

    const reject = () => {
        toast.current &&
            toast.current.show({
                severity: "warn",
                summary: "Rejected",
                detail: "You have rejected",
                life: 3000,
            });
        onHide();
    };

    const showTemplate = () => {
        confirmDialog({
            header: (
                <div className='confirm-header'>
                    <i className={`pi ${icon ? icon : "pi-times-circle"} confirm-header__icon`} />
                    <div className='confirm-header__title'>{title || "Are you sure?"}</div>
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
            <ConfirmDialog {...props} visible={visible} onHide={onHide} />
            <Toast ref={toast} />
        </>
    );
};
