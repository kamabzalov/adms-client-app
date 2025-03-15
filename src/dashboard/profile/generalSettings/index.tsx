import "./index.css";
import { ReactElement, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { SettingsFees } from "dashboard/profile/generalSettings/fees";
import { SettingsDeals } from "dashboard/profile/generalSettings/deals";
import { SettingsTaxes } from "dashboard/profile/generalSettings/taxes";
import { SettingsLease } from "dashboard/profile/generalSettings/lease";
import { SettingsAccount } from "dashboard/profile/generalSettings/account";
import { SettingsContract } from "dashboard/profile/generalSettings/contract";
import { SettingsStockNew } from "dashboard/profile/generalSettings/stockNew";
import { SettingsStockTradeIn } from "dashboard/profile/generalSettings/stockTradeIn";
import { SettingsWatermarking } from "dashboard/profile/generalSettings/watermarking";
import { SettingsInventoryGroups } from "dashboard/profile/generalSettings/inventory-groups";
import { useStore } from "store/hooks";
import { observer } from "mobx-react-lite";

interface TabItem {
    settingName: string;
    component: ReactElement;
    route: string;
}

export const GeneralSettings = observer((): ReactElement => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const store = useStore().generalSettingsStore;
    const { isSettingsChanged, saveSettings, getSettings } = store;

    useEffect(() => {
        getSettings();
    }, []);

    useEffect(() => {
        const defaultTabRoute = tabItems[0].route;
        const currentTab = searchParams.get("tab");
        if (!currentTab) {
            setSearchParams({ tab: defaultTabRoute });
        }
    }, [searchParams, setSearchParams]);

    const tabItems: TabItem[] = [
        {
            settingName: "Deals",
            route: "deals",
            component: (
                <SettingsDeals
                    settings={[
                        { name: "deal1", title: "Default deal type", value: 0 },
                        { name: "deal3", title: "Default deal status", value: 1 },
                    ]}
                />
            ),
        },
        { settingName: "Fees", route: "fees", component: <SettingsFees /> },
        { settingName: "Taxes", route: "taxes", component: <SettingsTaxes /> },
        {
            settingName: "Stock# for new inventory",
            route: "stock-for-new-inventory",
            component: (
                <SettingsStockNew
                    radioSettings={[
                        { name: "6vin", title: "Last 6 of VIN", value: 0 },
                        { name: "8vin", title: "Last 8 of VIN", value: 1 },
                    ]}
                />
            ),
        },
        {
            settingName: "Stock# for trade-in inventory",
            route: "stock-for-trade-in-inventory",
            component: (
                <SettingsStockTradeIn
                    radioSettings={[
                        { name: "6vin", title: "Last 6 of VIN", value: 0 },
                        { name: "8vin", title: "Last 8 of VIN", value: 1 },
                    ]}
                />
            ),
        },
        {
            settingName: "Inventory groups",
            route: "inventory-groups",
            component: <SettingsInventoryGroups />,
        },
        {
            settingName: "Account Settings",
            route: "account-settings",
            component: <SettingsAccount />,
        },
        {
            settingName: "Contract Settings",
            route: "contract-settings",
            component: <SettingsContract />,
        },
        { settingName: "Lease Settings", route: "lease-settings", component: <SettingsLease /> },
        {
            settingName: "Watermarking",
            route: "watermarking",
            component: <SettingsWatermarking />,
        },
    ];

    const activeTabParam = searchParams.get("tab") || tabItems[0].route;
    const activeTabIndex = tabItems.findIndex((tab) => tab.route === activeTabParam);

    const handleTabChange = (index: number) => {
        const selectedTabRoute = tabItems[index].route;
        setSearchParams({ tab: selectedTabRoute });
    };

    const handleBackClick = () => {
        const newIndex = Math.max(activeTabIndex - 1, 0);
        handleTabChange(newIndex);
    };

    const handleNextClick = () => {
        const newIndex = Math.min(activeTabIndex + 1, tabItems.length - 1);
        handleTabChange(newIndex);
    };

    return (
        <div className='grid relative general-settings'>
            <Button
                icon='pi pi-times'
                className='p-button close-button'
                onClick={() => navigate("/dashboard")}
            />
            <div className='col-12'>
                <div className='card'>
                    <div className='card-header flex'>
                        <h2 className='card-header__title uppercase m-0'>General settings</h2>
                    </div>
                    <TabView
                        className='general-settings__tabs'
                        activeIndex={activeTabIndex}
                        onTabChange={(e) => handleTabChange(e.index)}
                    >
                        {tabItems.map(({ settingName, component }) => {
                            return (
                                <TabPanel
                                    header={settingName}
                                    children={component}
                                    key={settingName}
                                    className='general-settings__panel'
                                />
                            );
                        })}
                    </TabView>
                    <div className='flex justify-content-end gap-3 mt-8 mr-3'>
                        <Button
                            onClick={handleBackClick}
                            className='uppercase px-6 form__button'
                            disabled={activeTabIndex <= 0}
                            severity={activeTabIndex <= 0 ? "secondary" : "success"}
                            outlined
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleNextClick}
                            disabled={activeTabIndex >= tabItems.length - 1}
                            severity={
                                activeTabIndex >= tabItems.length - 1 ? "secondary" : "success"
                            }
                            className='uppercase px-6 form__button'
                            outlined
                        >
                            Next
                        </Button>
                        <Button
                            className='uppercase px-6 form__button'
                            onClick={saveSettings}
                            severity={isSettingsChanged ? "success" : "secondary"}
                            disabled={!isSettingsChanged}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});
