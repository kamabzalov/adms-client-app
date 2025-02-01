import { observer } from "mobx-react-lite";
import { ReactElement, useEffect, useState } from "react";
import "./index.css";
import { CurrencyInput, DateInput } from "dashboard/common/form/inputs";
import { Checkbox } from "primereact/checkbox";
import { getDealPaymentsTotal } from "http/services/deals.service";
import { useParams } from "react-router-dom";
import { useStore } from "store/hooks";
import { useToast } from "dashboard/common/toast";

const EMPTY_PAYMENT_LENGTH = 7;

export const DealRetailPickup = observer((): ReactElement => {
    const { id } = useParams();
    const store = useStore().dealStore;
    const toast = useToast();
    const { dealPickupPayments, getPickupPayments, changeDealPickupPayments, dealErrorMessage } =
        store;
    const [totalPayments, setTotalPayments] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                await getPickupPayments(id);
                const data = await getDealPaymentsTotal(id);
                if (typeof data === "number") {
                    setTotalPayments(data);
                }
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (dealErrorMessage.length && toast.current) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: dealErrorMessage,
            });
        }
    }, [toast, dealErrorMessage]);

    const displayedPayments = dealPickupPayments.length
        ? dealPickupPayments
        : Array.from({ length: EMPTY_PAYMENT_LENGTH }, (_, index) => ({
              itemuid: `empty-${index}`,
              paydate: "",
              amount: 0,
              paid: 0,
          }));

    return (
        <div className='grid deal-retail-pickup'>
            <div className='col-12 pickup-header'>
                <div className='pickup-header__item'>Date</div>
                <div className='pickup-header__item'>Amount</div>
                <div className='pickup-header__item'>Paid</div>
            </div>
            <div className='pickup-body col-12'>
                {displayedPayments.map((payment) => (
                    <div key={payment.itemuid} className='pickup-row'>
                        <div className='pickup-row__item'>
                            <DateInput
                                checkbox
                                value={payment.paydate}
                                name={!payment.paydate ? "ХХ/ХХ/ХХХХ" : ""}
                                onChange={() => {
                                    changeDealPickupPayments(payment.itemuid, {
                                        key: "paydate",
                                        value: payment.paydate,
                                    });
                                }}
                            />
                        </div>
                        <div className='pickup-row__item'>
                            <div className='pickup-item'>
                                <CurrencyInput
                                    placeholder='0.00'
                                    value={payment.amount}
                                    onChange={({ value }) => {
                                        changeDealPickupPayments(payment.itemuid, {
                                            key: "amount",
                                            value: Number(value),
                                        });
                                    }}
                                />
                            </div>
                        </div>
                        <div className='pickup-row__item'>
                            <Checkbox
                                checked={!!payment.paid}
                                onChange={() =>
                                    changeDealPickupPayments(payment.itemuid, {
                                        key: "paid",
                                        value: !payment.paid ? 1 : 0,
                                    })
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className='col-12'>
                <div className='pickup-amount'>
                    <label className='pickup-amount__label'>Total Down</label>
                    <label className='pickup-amount__label'>${totalPayments || "0.00"}</label>
                </div>
            </div>
        </div>
    );
});
