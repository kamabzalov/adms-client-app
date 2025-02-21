import { getInventoryMediaItem } from "./../../../http/services/media.service";
import { Status } from "common/models/base-response";
import { Contact, ContactExtData, ContactOFAC, ContactProspect } from "common/models/contact";
import { MediaType } from "common/models/enums";
import { CreateMediaItemRecordResponse, InventorySetResponse } from "common/models/inventory";
import {
    deleteContactFrontDL,
    deleteContactBackDL,
    getContactInfo,
    setContactDL,
    setContact,
} from "http/services/contacts-service";
import { createMediaItemRecord, uploadInventoryMedia } from "http/services/media.service";
import { action, makeAutoObservable } from "mobx";
import { RootStore } from "store";

enum DLSides {
    FRONT = "front",
    BACK = "back",
}

export type DLSide = DLSides.FRONT | DLSides.BACK;

export class ContactStore {
    public rootStore: RootStore;
    private _contact: Contact = { type: 0 } as Contact;
    private _cobayerContact: Contact = { type: 0 } as Contact;
    private _contactType: number = 0;
    private _contactExtData: ContactExtData = {} as ContactExtData;
    private _contactProspect: Partial<ContactProspect>[] = [];
    private _contactID: string = "";
    private _contactOFAC: ContactOFAC = {} as ContactOFAC;
    protected _isLoading = false;
    private _frontSiteDLurl: string = "";
    private _backSiteDLurl: string = "";
    private _frontSiteDL: File = {} as File;
    private _backSiteDL: File = {} as File;
    private _coBuyerFrontSideDL: File = {} as File;
    private _coBuyerBackSideDL: File = {} as File;
    private _coBuyerFrontSideDLurl: string = "";
    private _coBuyerBackSideDLurl: string = "";
    private _isContactChanged: boolean = false;
    private _memoRoute: string = "";
    private _deleteReason: string = "";
    private _activeTab: number | null = null;
    private _tabLength: number = 0;

    public constructor(rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
        this.rootStore = rootStore;
    }

    public get contact() {
        return this._contact;
    }

    public get coBuyerContact() {
        return this._cobayerContact;
    }

    public get contactType() {
        return this._contactType;
    }

    public get contactExtData() {
        return this._contactExtData;
    }

    public get frontSideDL() {
        return this._frontSiteDL;
    }

    public get backSideDL() {
        return this._backSiteDL;
    }

    public get frontSideDLurl() {
        return this._frontSiteDLurl;
    }

    public get backSideDLurl() {
        return this._backSiteDLurl;
    }

    public get coBuyerFrontSideDL() {
        return this._coBuyerFrontSideDL;
    }

    public get coBuyerBackSideDL() {
        return this._coBuyerBackSideDL;
    }

    public get coBuyerFrontSideDLurl() {
        return this._coBuyerFrontSideDLurl;
    }

    public get coBuyerBackSideDLurl() {
        return this._coBuyerBackSideDLurl;
    }

    public get isContactChanged() {
        return this._isContactChanged;
    }

    public get contactOFAC() {
        return this._contactOFAC;
    }

    public get deleteReason() {
        return this._deleteReason;
    }

    public get isLoading() {
        return this._isLoading;
    }

    public get memoRoute() {
        return this._memoRoute;
    }

    public get tabLength() {
        return this._tabLength;
    }

    public get activeTab() {
        return this._activeTab;
    }

    public get contactFullInfo() {
        return {
            ...this._contact,
            extdata: this.contactExtData,
        };
    }

    public getContact = async (itemuid: string) => {
        this._isLoading = true;
        try {
            const response = await getContactInfo(itemuid);
            if (response && response.status === Status.ERROR) {
                throw response.error;
            } else {
                const { extdata, ...contact } = response as Contact;

                this._contactID = contact.contactuid;
                this.contactType = contact.type;
                this._contact = contact || ({} as Contact);
                this._contactExtData = extdata || ({} as ContactExtData);
                this._contactProspect = this._contact?.prospect || [];
            }
        } catch (error) {
            return {
                status: Status.ERROR,
                error,
            };
        } finally {
            this._isLoading = false;
        }
    };

    public getCoBuyerContact = async () => {
        if (!this._contact.cobuyeruid) return;
        try {
            const response = await getContactInfo(this._contact.cobuyeruid);
            if (response?.status === Status.ERROR) throw response.error;
            this._cobayerContact = response as Contact;
        } catch (error) {
            return { status: Status.ERROR, error };
        } finally {
            this._isLoading = false;
        }
    };

    public getImagesDL = (isCoBuyer?: boolean): void => {
        const uid = isCoBuyer ? this._contact.cobuyeruid : this._contactID;
        if (!uid) return;

        if (isCoBuyer) {
            if (this._cobayerContact.dluidfront) {
                getInventoryMediaItem(this._cobayerContact.dluidfront).then((res) => {
                    if (res) this._coBuyerFrontSideDLurl = res;
                });
            }
            if (this._cobayerContact.dluidback) {
                getInventoryMediaItem(this._cobayerContact.dluidback).then((res) => {
                    if (res) this._coBuyerBackSideDLurl = res;
                });
            }
            return;
        }

        if (this._contact.dluidfront) {
            getInventoryMediaItem(this._contact.dluidfront).then((res) => {
                if (res) this._frontSiteDLurl = res;
            });
        }
        if (this._contact.dluidback) {
            getInventoryMediaItem(this._contact.dluidback).then((res) => {
                if (res) this._backSiteDLurl = res;
            });
        }
    };

    public changeContact = action(
        (
            key: keyof Omit<Contact, "extdata">,
            value: string | number | string[],
            isContactChanged: boolean = true
        ) => {
            if (isContactChanged) {
                this._isContactChanged = true;
            }
            this._contact[key] = value as never;
        }
    );

    public changeContactExtData = action((key: keyof ContactExtData, value: string | number) => {
        this._isContactChanged = true;
        this._contactExtData[key] = value as never;
    });

    public saveContact = action(async (): Promise<string> => {
        try {
            this._isLoading = true;
            let newProspect: Partial<ContactProspect>[] = [];
            if (this._contactProspect.length) {
                const prospectFirst = this._contactProspect.find(
                    (pros) => pros?.notes === this._contactExtData.PROSPECT1_ID
                ) || { notes: this._contactExtData.PROSPECT1_ID };
                const prospectSecond = this._contactProspect.find(
                    (pros) => pros?.notes === this._contactExtData.PROSPECT2_ID
                ) || { notes: this._contactExtData.PROSPECT2_ID };
                newProspect = [...this._contactProspect, prospectFirst, prospectSecond].filter(
                    Boolean
                );
            }

            const contactData: Contact = {
                ...this.contact,
                extdata: this.contactExtData,
                prospect: newProspect as ContactProspect[],
            };

            const [contactDataResponse, imagesResponse] = await Promise.all([
                setContact(this._contactID, contactData),
                this.setImagesDL(this._contactID),
            ]);

            if (contactDataResponse?.status === Status.ERROR) {
                throw new Error(contactDataResponse?.error);
            }

            let responseStatus = Status.ERROR;

            if (contactDataResponse?.status === Status.OK) {
                responseStatus = Status.OK;
            }
            if (this._contactID && imagesResponse?.status === Status.OK) {
                responseStatus = Status.OK;
            }

            return responseStatus;
        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return String(error);
        } finally {
            this._isLoading = false;
        }
    });

    private setImagesDL = async (contactuid: string, isCoBuyer = false): Promise<any> => {
        this._isLoading = true;
        try {
            const frontFile = isCoBuyer ? this._coBuyerFrontSideDL : this._frontSiteDL;
            const backFile = isCoBuyer ? this._coBuyerBackSideDL : this._backSiteDL;

            if (frontFile.size) {
                const formData = new FormData();
                formData.append("file", frontFile);
                const createMediaResponse = (await createMediaItemRecord(
                    MediaType.mtPhoto
                )) as CreateMediaItemRecordResponse;
                if (!createMediaResponse || createMediaResponse.status !== Status.OK) {
                    throw createMediaResponse?.error || "Failed to create media record (front)";
                }
                const uploadMediaResponse = (await uploadInventoryMedia(
                    createMediaResponse.itemUID as string,
                    formData
                )) as InventorySetResponse;
                if (!uploadMediaResponse || uploadMediaResponse.status !== Status.OK) {
                    throw uploadMediaResponse?.error || "Failed to upload front media file";
                }
                const updateDLResponse = await setContactDL(contactuid, {
                    dluidfront: uploadMediaResponse.itemuid,
                });
                if (!updateDLResponse || updateDLResponse.status !== Status.OK) {
                    throw updateDLResponse?.error || "Failed to update contact front DL UID";
                }
            }

            if (backFile.size) {
                const formData = new FormData();
                formData.append("file", backFile);
                const createMediaResponse = (await createMediaItemRecord(
                    MediaType.mtPhoto
                )) as CreateMediaItemRecordResponse;
                if (!createMediaResponse || createMediaResponse.status !== Status.OK) {
                    throw createMediaResponse?.error || "Failed to create media record (back)";
                }
                const uploadMediaResponse = (await uploadInventoryMedia(
                    createMediaResponse.itemUID as string,
                    formData
                )) as InventorySetResponse;
                if (!uploadMediaResponse || uploadMediaResponse.status !== Status.OK) {
                    throw uploadMediaResponse?.error || "Failed to upload back media file";
                }
                const updateDLResponse = await setContactDL(contactuid, {
                    dluidback: uploadMediaResponse.itemuid,
                });
                if (!updateDLResponse || updateDLResponse.status !== Status.OK) {
                    throw updateDLResponse?.error || "Failed to update contact back DL UID";
                }
            }

            return { status: Status.OK };
        } catch (error) {
            return {
                status: Status.ERROR,
                error: error instanceof Error ? error.message : String(error),
            };
        } finally {
            this._isLoading = false;
        }
    };

    public removeImagesDL = async (side: DLSide, isCoBuyer: boolean = false) => {
        this._isLoading = true;
        try {
            const uid = isCoBuyer ? this._contact.cobuyeruid : this._contact.contactuid;
            if (!uid) return { status: Status.ERROR, error: "Missing contact ID" };

            let response;
            if (side === DLSides.FRONT) {
                if (isCoBuyer) {
                    if (this.coBuyerFrontSideDL) {
                        response = await deleteContactFrontDL(uid);
                        if (response?.status === Status.ERROR)
                            return { status: response.status, error: response.error };
                    }
                    this._cobayerContact.dluidfront = "";
                } else {
                    if (this.frontSideDL) {
                        response = await deleteContactFrontDL(uid);
                        if (response?.status === Status.ERROR)
                            return { status: response.status, error: response.error };
                    }
                    this._contact.dluidfront = "";
                }
            } else {
                if (isCoBuyer) {
                    if (this.coBuyerBackSideDL) {
                        response = await deleteContactBackDL(uid);
                        if (response?.status === Status.ERROR)
                            return { status: response.status, error: response.error };
                    }
                    this._cobayerContact.dluidback = "";
                } else {
                    if (this.backSideDL) {
                        response = await deleteContactBackDL(uid);
                        if (response?.status === Status.ERROR)
                            return { status: response.status, error: response.error };
                    }
                    this._contact.dluidback = "";
                }
            }
            return { status: Status.OK };
        } catch (error) {
            return { status: Status.ERROR, error };
        } finally {
            this._isLoading = false;
        }
    };

    public set contactType(state: number) {
        this._contactType = state;
    }

    public set frontSideDL(file: File) {
        this._frontSiteDL = file;
    }

    public set backSideDL(file: File) {
        this._backSiteDL = file;
    }

    public set frontSideDLurl(url: string) {
        this._frontSiteDLurl = url;
    }

    public set backSideDLurl(url: string) {
        this._backSiteDLurl = url;
    }

    public set coBuyerFrontSideDL(file: File) {
        this._coBuyerFrontSideDL = file;
    }

    public set coBuyerBackSideDL(file: File) {
        this._coBuyerBackSideDL = file;
    }

    public set coBuyerFrontSideDLurl(url: string) {
        this._coBuyerFrontSideDLurl = url;
    }

    public set coBuyerBackSideDLurl(url: string) {
        this._coBuyerBackSideDLurl = url;
    }

    public set contactOFAC(state: ContactOFAC) {
        this._contactOFAC = state;
    }

    public set deleteReason(state: string) {
        this._deleteReason = state;
    }

    public set isLoading(state: boolean) {
        this._isLoading = state;
    }

    public set memoRoute(state: string) {
        this._memoRoute = state;
    }

    public set tabLength(state: number) {
        this._tabLength = state;
    }

    public set activeTab(state: number | null) {
        this._activeTab = state;
    }

    public set isContactChanged(state: boolean) {
        this._isContactChanged = state;
    }

    public clearContact = () => {
        this._contact = {} as Contact;
        this._cobayerContact = {} as Contact;
        this._isContactChanged = false;
        this._contactID = "";
        this._contactType = 0;
        this._frontSiteDLurl = "";
        this._backSiteDLurl = "";
        this._coBuyerFrontSideDLurl = "";
        this._coBuyerBackSideDLurl = "";
        this._frontSiteDL = {} as File;
        this._backSiteDL = {} as File;
        this._coBuyerFrontSideDL = {} as File;
        this._coBuyerBackSideDL = {} as File;
        this._contactExtData = {} as ContactExtData;
        this._deleteReason = "";
    };
}
