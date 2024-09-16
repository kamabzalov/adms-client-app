import { TabView, TabPanel } from "primereact/tabview";
import { ReactElement, useEffect } from "react";
import { Button } from "primereact/button";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "store/hooks";
import { AccountQuickPay } from "./quick-pay";
import { AccountPayOff } from "./pay-off";
import { AccountBalanceAdjustment } from "./balance-adjustment";
import "./index.css";

export enum AccountTakePaymentTabs {
    QUICK_PAY = "quick-pay",
    PAY_OFF = "pay-off",
    BALANCE_ADJUSTMENT = "balance-adjustment",
}

export const AccountTakePayment = (): ReactElement => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const store = useStore().accountStore;
    const userStore = useStore().userStore;
    const { authUser } = userStore;
    const {
        account: { accountnumber, accountstatus },
        getAccountPaymentsInfo,
        getDrawers,
    } = store;

    useEffect(() => {
        if (id) {
            getAccountPaymentsInfo(id);
            getDrawers(authUser?.useruid!);
        }
    }, [id]);

    const tabParam = searchParams.get("tab") || AccountTakePaymentTabs.QUICK_PAY;

    const activeIndex = (() => {
        switch (tabParam) {
            case AccountTakePaymentTabs.PAY_OFF:
                return 1;
            case AccountTakePaymentTabs.BALANCE_ADJUSTMENT:
                return 2;
            case AccountTakePaymentTabs.QUICK_PAY:
            default:
                return 0;
        }
    })();

    const handleTabChange = (e: { index: number }) => {
        let newTab: AccountTakePaymentTabs;
        switch (e.index) {
            case 0:
                newTab = AccountTakePaymentTabs.QUICK_PAY;
                break;
            case 1:
                newTab = AccountTakePaymentTabs.PAY_OFF;
                break;
            case 2:
                newTab = AccountTakePaymentTabs.BALANCE_ADJUSTMENT;
                break;
            default:
                newTab = AccountTakePaymentTabs.QUICK_PAY;
        }
        setSearchParams({ tab: newTab });
    };

    useEffect(() => {
        const validTabs = Object.values(AccountTakePaymentTabs);
        if (!validTabs.includes(tabParam as AccountTakePaymentTabs)) {
            setSearchParams({ tab: AccountTakePaymentTabs.QUICK_PAY });
        }
    }, [tabParam, setSearchParams]);

    return (
        <div className='grid relative take-payment'>
            <Button
                icon='pi pi-times'
                className='p-button close-button'
                onClick={() => navigate(`/dashboard/accounts/${id}`)}
            />
            <div className='col-12'>
                <div className='card account'>
                    <div className='card-header flex'>
                        <h2 className='card-header__title uppercase m-0'>Take Payment</h2>
                        {id && (
                            <div className='card-header-info'>
                                Account Number
                                <span className='card-header-info__data'>{accountnumber}</span>
                                Status
                                <span className='card-header-info__data uppercase'>
                                    {accountstatus}
                                </span>
                                Overdue Status
                                <span className='card-header-info__data'>54</span>
                            </div>
                        )}
                    </div>
                    <div className='card-content account__card grid'>
                        <TabView
                            className='take-payment__tabs'
                            activeIndex={activeIndex}
                            onTabChange={handleTabChange}
                        >
                            <TabPanel header='Quick Pay'>
                                <AccountQuickPay />
                            </TabPanel>
                            <TabPanel header='Pay Off'>
                                <AccountPayOff />
                            </TabPanel>
                            <TabPanel header='Balance Adjustment'>
                                <AccountBalanceAdjustment />
                            </TabPanel>
                        </TabView>
                    </div>
                    <div className='account__footer gap-3 ml-auto mr-3'>
                        <Button
                            className='uppercase px-6 account__button'
                            onClick={() => navigate(`/dashboard/accounts/${id}`)}
                            severity='danger'
                            outlined
                        >
                            Cancel
                        </Button>
                        <Button className='uppercase px-6 account__button'>Save</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};