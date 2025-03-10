import "./index.css";
import { Link } from "react-router-dom";
import { useState, useEffect, ReactElement } from "react";
import { useStore } from "store/hooks";
import { observer } from "mobx-react-lite";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";

export const Sidebar = observer((): ReactElement => {
    const store = useStore().userStore;
    const { authUser, settings } = store;
    const [isSalesPerson, setIsSalesPerson] = useState(true);

    useEffect(() => {
        if (authUser && Object.keys(authUser.permissions).length) {
            const { permissions } = authUser;
            const { uaSalesPerson, ...otherPermissions } = permissions;
            if (Object.values(otherPermissions).some((permission) => permission === 1)) {
                return setIsSalesPerson(false);
            }
            if (!!uaSalesPerson) setIsSalesPerson(true);
        }
    }, [authUser, authUser?.permissions]);

    const renderNavItem = (to: string, iconClass: string, label: string): ReactElement => {
        const itemId = `nav-item-${to.replace(/\//g, "-")}`;
        return (
            <li className='sidebar-nav__item'>
                {settings.isSidebarCollapsed && (
                    <Tooltip target={`#${itemId}`} content={label} position='right' />
                )}
                <Link to={to} id={itemId} className='sidebar-nav__link'>
                    <div className={`sidebar-nav__icon ${iconClass}`}></div>
                    {!settings.isSidebarCollapsed && <span>{label}</span>}
                </Link>
            </li>
        );
    };

    return (
        <aside
            className={`sidebar hidden lg:block ${settings.isSidebarCollapsed ? "collapsed" : ""}`}
        >
            <Button
                className='sidebar-toggle'
                onClick={() => settings.toggleSidebar()}
                rounded
                icon='pi pi-angle-left'
                aria-label={`${settings.isSidebarCollapsed ? "Expand" : "Collapse"} sidebar`}
                tooltip={`${settings.isSidebarCollapsed ? "Expand" : "Collapse"} sidebar`}
                pt={{
                    icon: {
                        className: `${settings.isSidebarCollapsed ? "pi pi-angle-right" : "pi pi-angle-left"}`,
                    },
                }}
            />
            <ul className='sidebar-nav'>
                {renderNavItem("/dashboard", "home", "Home")}
                {renderNavItem("/dashboard/inventory", "inventory", "Inventory")}
                {isSalesPerson || (
                    <>
                        {renderNavItem("/dashboard/contacts", "contacts", "Contacts")}
                        {renderNavItem("/dashboard/deals", "deals", "Deals")}
                        {renderNavItem("/dashboard/accounts", "accounts", "Accounts")}
                        {renderNavItem("/dashboard/reports", "reports", "Reports")}
                        {renderNavItem("/dashboard/export-web", "export-web", "Export to Web")}
                        {renderNavItem("/dashboard/tasks", "tasks", "Tasks")}
                    </>
                )}
            </ul>
        </aside>
    );
});
