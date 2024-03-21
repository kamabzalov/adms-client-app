import { MenuItem, MenuItemOptions } from "primereact/menuitem";
import { ReactElement } from "react";

/* eslint-disable jsx-a11y/anchor-is-valid */

export interface InventoryItem extends MenuItem {
    itemLabel: string;
    itemIndex?: number;
    component?: ReactElement;
}

export interface Inventory {
    label: string;
    items: InventoryItem[];
    sectionId: number;
    startIndex: number;
    getLength: () => number;
}

export class InventorySection implements Inventory {
    private static instancesCount: number = 0;
    private static itemIndex: number = 0;
    public sectionId: number;
    public label: string;
    public startIndex: number = 0;
    public items: InventoryItem[];

    public constructor({ label, items }: { label: string; items: InventoryItem[] }) {
        this.sectionId = ++InventorySection.instancesCount;
        this.label = label;
        this.items = items.map(({ itemLabel, component }, index: number) => ({
            itemLabel,
            component,
            itemIndex: InventorySection.itemIndex++,
            template: (item: MenuItem, options: MenuItemOptions) => {
                return this.newTemplate(item, options, index);
            },
        }));
        this.startIndex = InventorySection.itemIndex - this.items.length;
    }

    private newTemplate(
        item: MenuItem,
        { props, onClick, className, labelClassName }: MenuItemOptions,
        index: number
    ): JSX.Element {
        const isGreen =
            (InventorySection.instancesCount > this.items.length || index <= props.activeIndex) &&
            props.activeIndex !== 0;

        return (
            <a
                href='#'
                onClick={onClick}
                className={`${className} vertical-nav flex-row align-items-center justify-content-start w-full`}
            >
                <label
                    className={`vertical-nav__icon p-steps-number ${
                        isGreen && "p-steps-number--green"
                    } border-circle`}
                />
                <span className={`${labelClassName} vertical-nav__label`}>{item.label}</span>
            </a>
        );
    }

    public getLength(): number {
        return this.items.length;
    }
}
