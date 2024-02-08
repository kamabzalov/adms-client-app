import { Status } from "common/models/base-response";
import {
    Inventory,
    InventoryExtData,
    InventoryMediaItemID,
    InventoryOptionsInfo,
} from "common/models/inventory";
import {
    createMediaItemRecord,
    deleteMediaImage,
    getInventoryInfo,
    getInventoryMediaItem,
    getInventoryMediaItemList,
    pairMediaWithInventoryItem,
    setInventory,
    uploadInventoryMedia,
} from "http/services/inventory-service";
import { action, configure, makeAutoObservable } from "mobx";

configure({
    enforceActions: "never",
});

export class RootStore {
    public inventoryStore: InventoryStore;
    public constructor() {
        this.inventoryStore = new InventoryStore(this);
    }
}

interface ImageItem {
    src: string;
    itemuid: string;
}

class InventoryStore {
    public rootStore: RootStore;
    private _inventory: Inventory = {} as Inventory;
    private _inventoryID: string = "";
    private _inventoryOptions: InventoryOptionsInfo[] = [];
    private _inventoryExtData: InventoryExtData = {} as InventoryExtData;

    private _inventoryImagesID: Partial<InventoryMediaItemID>[] = [];
    private _uploadFileImages: File[] = [];
    private _images: ImageItem[] = [];

    private _inventoryVideoID: string[] = [];
    private _inventoryAudioID: string[] = [];
    private _inventoryDocumentsID: string[] = [];
    protected _isLoading = false;

    public constructor(rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
        this.rootStore = rootStore;
    }

    public get inventory() {
        return this._inventory;
    }
    public get inventoryOptions() {
        return this._inventoryOptions;
    }
    public get inventoryExtData() {
        return this._inventoryExtData;
    }
    public get uploadFileImages() {
        return this._uploadFileImages;
    }
    public get images() {
        return this._images;
    }
    public get isLoading() {
        return this._isLoading;
    }

    public set isLoading(state: boolean) {
        this._isLoading = state;
    }

    public getInventory = async (itemuid: string) => {
        this._isLoading = true;
        try {
            const response = await getInventoryInfo(itemuid);
            if (response) {
                const { extdata, options_info, ...inventory } = response;
                this._inventoryID = response.itemuid;
                this._inventory = inventory || ({} as Inventory);
                this._inventoryOptions = options_info || [];
                this._inventoryExtData = extdata || ({} as InventoryExtData);
            }
        } catch (error) {
        } finally {
            this._isLoading = false;
        }
    };

    private getInventoryMedia = async (): Promise<Status> => {
        this._isLoading = true;
        try {
            const response = await getInventoryMediaItemList(this._inventoryID);
            if (response && response.length > 0) {
                response.forEach(({ contenttype, mediauid, itemuid }) => {
                    if (mediauid) {
                        switch (contenttype) {
                            case 0:
                                this._inventoryImagesID.push({ itemuid, mediauid });
                                break;
                            case 1:
                                this._inventoryVideoID.push(mediauid);
                                break;
                            case 2:
                                this._inventoryAudioID.push(mediauid);
                                break;
                            case 3:
                                this._inventoryDocumentsID.push(mediauid);
                                break;
                            default:
                                break;
                        }
                    }
                });
            }

            return Status.OK;
        } catch (error) {
            return Status.ERROR;
        } finally {
            this._isLoading = false;
        }
    };

    public changeInventory = action(
        ({ key, value }: { key: keyof Inventory; value: string | number }) => {
            if (this._inventory && key !== "extdata" && key !== "options_info") {
                (this._inventory as Record<typeof key, string | number>)[key] = value;
            }
        }
    );

    public changeInventoryExtData = action(
        ({ key, value }: { key: keyof InventoryExtData; value: string | number }) => {
            const inventoryStore = this.rootStore.inventoryStore;
            if (inventoryStore) {
                const { inventoryExtData } = inventoryStore;
                (inventoryExtData as Record<typeof key, string | number>)[key] = value;
            }
        }
    );

    public changeInventoryOptions = action((optionName: InventoryOptionsInfo) => {
        const inventoryStore = this.rootStore.inventoryStore;
        if (inventoryStore) {
            const { inventoryOptions } = inventoryStore;

            if (inventoryOptions.includes(optionName)) {
                const updatedOptions = inventoryOptions.filter((option) => option !== optionName);
                inventoryStore._inventoryOptions = updatedOptions;
            } else {
                inventoryStore._inventoryOptions.push(optionName);
            }
        }
    });

    public saveInventory = action(async (): Promise<string | undefined> => {
        try {
            const response = await setInventory(this._inventoryID, this._inventory);
            if (response?.status === Status.OK) return response.itemuid;
        } catch (error) {
            // TODO: add error handler
            return undefined;
        }
    });

    public saveInventoryImages = action(async (): Promise<Status | undefined> => {
        try {
            this._isLoading = true;
            this._images = [];
            const uploadPromises = this._uploadFileImages.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const createMediaResponse = await createMediaItemRecord();
                    if (createMediaResponse?.status === Status.OK) {
                        const uploadMediaResponse = await uploadInventoryMedia(
                            createMediaResponse.itemUID,
                            formData
                        );
                        if (uploadMediaResponse?.status === Status.OK) {
                            await pairMediaWithInventoryItem(
                                this._inventoryID,
                                uploadMediaResponse.itemuid
                            );
                        }
                    }
                } catch (error) {
                    // TODO: add error handler
                }
            });

            await Promise.all(uploadPromises);
            this._uploadFileImages = [];
            this.fetchImages();

            return Status.OK;
        } catch (error) {
            // TODO: add error handler
            return undefined;
        } finally {
            this._isLoading = false;
        }
    });

    public fetchImages = action(async () => {
        try {
            this._isLoading = true;
            this._inventoryImagesID = [];
            await this.getInventoryMedia();

            const result: ImageItem[] = [];

            await Promise.all(
                this._inventoryImagesID.map(async ({ mediauid, itemuid }) => {
                    if (mediauid && itemuid) {
                        const response = await getInventoryMediaItem(mediauid);
                        if (response) {
                            result.push({ itemuid, src: response });
                        }
                    }
                })
            );

            this._images = result;
        } catch (error) {
            // Handle or log the error
        } finally {
            this._isLoading = false;
        }
    });

    public removeImage = action(async (imageuid: string): Promise<Status | undefined> => {
        try {
            this._isLoading = true;

            try {
                await deleteMediaImage(imageuid);
                await this.fetchImages();
            } catch (error) {
                // TODO: add error handler
            }

            return Status.OK;
        } catch (error) {
            // TODO: add error handler
            return undefined;
        } finally {
            this._isLoading = false;
        }
    });

    public set uploadFileImages(files: File[]) {
        this._uploadFileImages = files;
    }

    public clearInventory = () => {
        this._inventory = {} as Inventory;
        this._inventoryOptions = [];
        this._inventoryExtData = {} as InventoryExtData;
        this._inventoryImagesID = [];
    };
}

export const store = new RootStore();
