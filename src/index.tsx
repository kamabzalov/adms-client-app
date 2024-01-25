import { Router as RemixRouter } from "@remix-run/router/dist/router";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "App";
import Dashboard from "dashboard";
import NotFound from "not-found";
import Home from "./dashboard/home";
import Inventory from "./dashboard/inventory";
import SignIn from "./sign/sign-in";
import Contacts from "./dashboard/contacts";
import Deals from "dashboard/deals";
import Accounts from "dashboard/accounts";
import Reports from "dashboard/reports";
import { InventoryForm } from "dashboard/inventory/form";
import { ContactForm } from "dashboard/contacts/form";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const router: RemixRouter = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <NotFound />,
        children: [
            {
                path: "",
                element: <SignIn />,
            },
            {
                path: "/dashboard",
                element: <Dashboard />,
                children: [
                    {
                        path: "",
                        element: <Home />,
                    },
                    {
                        path: "inventory",
                        children: [
                            { path: "", element: <Inventory /> },
                            { path: "create", element: <InventoryForm /> },
                            { path: ":id", element: <InventoryForm /> },
                        ],
                    },
                    {
                        path: "contacts",
                        children: [
                            { path: "", element: <Contacts /> },
                            { path: "create", element: <ContactForm /> },
                            { path: ":id", element: <ContactForm /> },
                        ],
                    },
                    {
                        path: "deals",
                        element: <Deals />,
                    },
                    {
                        path: "accounts",
                        element: <Accounts />,
                    },
                    {
                        path: "reports",
                        element: <Reports />,
                    },
                ],
            },
        ],
    },
]);

root.render(<RouterProvider router={router} />);
