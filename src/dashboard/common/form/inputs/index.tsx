import { CSSProperties, LegacyRef, ReactElement, useEffect, useRef, useState } from "react";
import { RadioButton, RadioButtonChangeEvent, RadioButtonProps } from "primereact/radiobutton";
import "./index.css";
import { InputNumber, InputNumberProps } from "primereact/inputnumber";
import { Checkbox, CheckboxProps } from "primereact/checkbox";
import { Calendar, CalendarProps } from "primereact/calendar";
import { Dropdown, DropdownProps } from "primereact/dropdown";
import { InputText, InputTextProps } from "primereact/inputtext";
import { STATES_LIST } from "common/constants/states";
import { Button } from "primereact/button";
import { InputMask, InputMaskProps } from "primereact/inputmask";

type LabelPosition = "left" | "right" | "top";

interface DashboardRadioProps {
    radioArray: RadioButtonProps[];
    style?: CSSProperties;
    disabled?: boolean;
    initialValue?: string | number;
    onChange?: (value: string | number) => void;
}

interface CurrencyInputProps extends InputNumberProps {
    labelPosition?: LabelPosition;
}

interface PercentInputProps extends InputNumberProps {
    labelPosition?: LabelPosition;
}

type Push<N extends number, T extends any[]> = ((...args: T) => void) extends (
    head: any,
    ...tail: infer R
) => void
    ? [...R, any]["length"] extends N
        ? T
        : Push<N, [...T, any]>
    : never;

type Range<
    Start extends number,
    End extends number,
    T extends any[] = Push<Start, []>,
> = T["length"] extends End ? never : T["length"] | Range<Start, End, [any, ...T]>;

interface DateInputProps extends CalendarProps {
    date?: number | Date | string;
    colWidth?: Range<1, 13>;
    checkbox?: boolean;
    emptyDate?: boolean;
}

interface TextInputProps extends InputTextProps {
    colWidth?: Range<1, 13>;
    clearButton?: boolean;
}

interface PhoneInputProps extends InputMaskProps {
    colWidth?: Range<1, 13>;
}

interface StateDropdownProps extends DropdownProps {
    colWidth?: Range<1, 13>;
}

export const DashboardRadio = ({
    radioArray,
    initialValue,
    style,
    disabled,
    onChange,
}: DashboardRadioProps): ReactElement => {
    const [radioValue, setRadioValue] = useState<string | number>("" || 0);

    const handleRadioChange = (e: RadioButtonChangeEvent) => {
        const value = e.value as string | number;
        setRadioValue(value);
        onChange && onChange(value);
    };

    useEffect(() => {
        initialValue && setRadioValue(initialValue);
    }, [initialValue]);

    return (
        <div className='flex flex-wrap row-gap-3 justify-content-between radio'>
            {radioArray.map(({ name, title, value }) => (
                <div
                    key={name}
                    className='flex align-items-center justify-content-between radio__item radio-item border-round'
                    style={style}
                >
                    <div className='radio-item__input flex align-items-center justify-content-center'>
                        <RadioButton
                            inputId={name}
                            name={name}
                            disabled={disabled}
                            value={value}
                            onChange={handleRadioChange}
                            checked={radioValue === value}
                        />
                    </div>

                    <label htmlFor={name} className='radio-item__label'>
                        {title}
                    </label>
                </div>
            ))}
        </div>
    );
};

export const CurrencyInput = ({
    name,
    value,
    title,
    labelPosition = "left",
    ...props
}: CurrencyInputProps): ReactElement => {
    const inputRef = useRef<null | any>(null);

    const handleFocus = () => {
        const realInput = inputRef.current?.inputRef?.current;
        if (realInput) {
            realInput.setSelectionRange(0, 0);
        }
    };

    return (
        <div
            key={name}
            className={"flex align-items-center justify-content-between currency-item relative"}
        >
            <label className={`currency-item__label ${labelPosition === "top" && "label-top"}`}>
                {title}
            </label>
            <div className='currency-item__input flex justify-content-center'>
                <div className='currency-item__icon input-icon input-icon-left'>$</div>
                <InputNumber
                    ref={inputRef}
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    locale='en-US'
                    onFocus={handleFocus}
                    value={value || 0}
                    {...props}
                />
            </div>
        </div>
    );
};

export const PercentInput = ({
    name,
    title,
    labelPosition = "left",
    ...props
}: PercentInputProps): ReactElement => {
    return (
        <div
            key={name}
            className='flex align-items-center justify-content-between percent-item relative'
        >
            <label
                htmlFor={name}
                className={`percent-item__label ${labelPosition === "top" && "label-top"}`}
            >
                {title}
            </label>
            <div className='percent-item__input flex justify-content-center'>
                <InputNumber inputId={name} min={0} minFractionDigits={2} name={name} {...props} />
                <div className='percent-item__icon input-icon input-icon-right'>%</div>
            </div>
        </div>
    );
};

export const BorderedCheckbox = ({
    name,
    height = "50px",
    ...props
}: CheckboxProps): ReactElement => {
    return (
        <div
            style={{
                height,
            }}
            className='p-inputgroup flex-1 w-full align-items-center justify-content-between bordered-checkbox'
        >
            <label
                className={`cursor-pointer ${props.disabled ? "p-disabled" : ""}`}
                htmlFor={name}
            >
                {name}
            </label>
            <span className='p-inputgroup-addon'>
                <Checkbox inputId={name} {...props} />
            </span>
        </div>
    );
};

interface SearchInputProps extends DropdownProps {
    onInputChange?: (value: string) => void;
    onIconClick?: () => void;
}

export const SearchInput = ({
    height = "50px",
    title,
    onInputChange,
    onIconClick,
    ...props
}: SearchInputProps): ReactElement => {
    const dropdownRef: LegacyRef<any> = useRef(null);

    const handleOnInputChange = ({ target }: any) => {
        const { value } = target as DropdownProps;
        if (onInputChange && value) {
            dropdownRef.current.show();
            onInputChange(value);
        } else {
            dropdownRef.current.hide();
        }
    };

    return (
        <div
            key={props.name}
            style={{
                height,
            }}
            className='flex align-items-center search-input'
        >
            <span className='p-float-label search-input__wrapper'>
                <Dropdown
                    ref={dropdownRef}
                    onInput={handleOnInputChange}
                    optionLabel='name'
                    editable
                    placeholder={title}
                    {...props}
                    pt={{
                        trigger: {
                            className: "hidden",
                        },
                    }}
                />
                <label className='float-label search-input__label'>{title}</label>
            </span>
            <button
                className='search-input__icon input-icon input-icon-right'
                onClick={onIconClick}
                type='button'
            >
                <i className='icon adms-table' />
            </button>
        </div>
    );
};

export const DateInput = ({
    date,
    name,
    value,
    checkbox,
    colWidth,
    emptyDate,
    ...props
}: DateInputProps): ReactElement => {
    const [innerDate, setInnerDate] = useState<Date | null>(null);
    const [isChecked, setIsChecked] = useState<boolean>(false);

    useEffect(() => {
        if (date !== undefined && date !== null && !isNaN(Number(date))) {
            setInnerDate(new Date(Number(date)));
        } else if (!emptyDate) {
            setInnerDate(new Date());
        } else {
            setInnerDate(null);
        }
    }, [date, emptyDate]);

    const handleDateChange = (selected: Date | null) => {
        setInnerDate(selected);
    };

    const content = (
        <div
            key={name}
            className='flex align-items-center justify-content-between date-item relative'
        >
            <label
                htmlFor={name}
                className={`date-item__label ${date ? "" : "date-item__label--empty"} label-top`}
            >
                {name}
            </label>
            <div className='date-item__input w-full flex'>
                {checkbox && (
                    <Checkbox
                        className='date-item__checkbox'
                        checked={isChecked}
                        onChange={() => setIsChecked(!isChecked)}
                    />
                )}
                <Calendar
                    inputId={name}
                    value={checkbox && !isChecked ? null : innerDate}
                    disabled={checkbox && !isChecked}
                    className={`w-full date-item__calendar ${checkbox && "date-item__calendar--checkbox"}`}
                    onChange={(e) => handleDateChange(e.value as Date | null)}
                    {...props}
                />
                <div className='date-item__icon input-icon input-icon-right'>
                    <i className='adms-calendar' />
                </div>
            </div>
        </div>
    );

    return colWidth ? <div className={`col-${colWidth}`}>{content}</div> : content;
};

export const TextInput = ({
    name,
    colWidth,
    clearButton,
    ...props
}: TextInputProps): ReactElement => {
    const [value, setValue] = useState<string>(props.value || "");

    useEffect(() => {
        setValue(props.value || "");
    }, [props.value]);

    const handleClear = () => {
        setValue("");
        if (props.onChange) {
            props.onChange({
                target: {
                    name,
                    value: "",
                },
            } as React.ChangeEvent<HTMLInputElement>);
        }
    };
    const content = (
        <span className='p-float-label relative'>
            <InputText
                className='w-full'
                style={{ height: `${props.height || 50}px` }}
                tooltipOptions={{ showOnDisabled: true, style: { maxWidth: "490px" } }}
                value={value.trim()}
                onChange={(e) => {
                    props.onChange && props.onChange(e);
                    setValue(e.target.value);
                }}
                {...props}
            />
            {clearButton && value && (
                <Button
                    type='button'
                    text
                    icon='pi pi-times'
                    className='clear-input-button'
                    onClick={handleClear}
                />
            )}
            <label className='float-label'>{name}</label>
        </span>
    );

    return colWidth ? <div className={`col-${colWidth}`}>{content}</div> : content;
};

export const StateDropdown = ({ name, colWidth, ...props }: StateDropdownProps): ReactElement => {
    const content = (
        <span className='p-float-label'>
            <Dropdown
                optionLabel='label'
                optionValue='id'
                filter={props.filter || true}
                options={STATES_LIST}
                className={`w-full ${props.className || ""}`}
                style={{ height: `${props.height || 50}px` }}
                {...props}
            />
            <label className='float-label'>{name}</label>
        </span>
    );

    return colWidth ? <div className={`col-${colWidth}`}>{content}</div> : content;
};

export const PhoneInput = ({ name, colWidth, ...props }: PhoneInputProps): ReactElement => {
    const inputRef = useRef(null);

    const handleCursorPosition = () => {
        const input = inputRef.current as unknown as HTMLInputElement | null;

        if (input) {
            const value = input.value?.replace(/\D/g, "");
            const firstEmptyPosition = value?.length;

            input?.setSelectionRange &&
                input.setSelectionRange(firstEmptyPosition, firstEmptyPosition);
        }
    };

    const content = (
        <span className='p-float-label relative'>
            <InputMask
                type='tel'
                ref={inputRef}
                mask='999-999-9999'
                className='w-full'
                style={{ height: `${props.height || 50}px` }}
                onClick={handleCursorPosition}
                id={name || "phoneId"}
                tooltipOptions={{ showOnDisabled: true, style: { maxWidth: "490px" } }}
                {...props}
            />
            <label className='float-label'>{name}</label>
        </span>
    );

    return colWidth ? <div className={`col-${colWidth}`}>{content}</div> : content;
};
