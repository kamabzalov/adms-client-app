import { authorizedUserApiInstance } from "http/index";
import { QueryParams } from "common/models/query-params";
import { BaseResponse, BaseResponseError, Status } from "common/models/base-response";
import { ExportWebList, ExportWebPostData } from "common/models/export-web";

export interface TotalExportToWebList extends BaseResponse {
    total: number;
}

export const getExportToWebList = async (useruid: string, queryParams?: QueryParams) => {
    try {
        const request = await authorizedUserApiInstance.get<ExportWebList[] | TotalExportToWebList>(
            `inventory/${useruid}/weblist`,
            {
                params: queryParams,
            }
        );
        return request.data;
    } catch (error) {
        // TODO: add error handler
    }
};

export const addExportTask = async (useruid: string, { data, columns }: ExportWebPostData) => {
    try {
        const request = await authorizedUserApiInstance.post<BaseResponseError>(
            `external/${useruid}/export`,
            { data, columns, useruid }
        );
        return request.data;
    } catch (error) {
        return {
            status: Status.ERROR,
            error: "Error while add export task",
        };
    }
};

export const addExportTaskToSchedule = async (
    useruid: string,
    { data, columns }: ExportWebPostData
) => {
    try {
        const request = await authorizedUserApiInstance.post<BaseResponseError>(
            `external/${useruid}/schedule`,
            { data, columns, useruid }
        );
        return request.data;
    } catch (error) {
        return {
            status: Status.ERROR,
            error: "Error while schedule export task",
        };
    }
};

export const getExportScheduleList = async (useruid: string) => {
    try {
        const request = await authorizedUserApiInstance.get<ExportWebList[]>(
            `external/${useruid}/schedule`
        );
        return request.data;
    } catch (error) {
        // TODO: add error handler
    }
};

export const getExportHistoryList = async (useruid: string) => {
    try {
        const request = await authorizedUserApiInstance.get<ExportWebList[]>(
            `external/${useruid}/history`
        );
        return request.data;
    } catch (error) {
        // TODO: add error handler
    }
};

export const exportTaskScheduleDelete = async (taskuid: string) => {
    try {
        const request = await authorizedUserApiInstance.post<BaseResponseError>(
            `external/${taskuid}/delete`
        );
        return request.data;
    } catch (error) {
        return {
            status: Status.ERROR,
            error: "Error while delete export task",
        };
    }
};

export const exportTaskSchedulePause = async (taskuid: string) => {
    try {
        const request = await authorizedUserApiInstance.post<BaseResponseError>(
            `external/${taskuid}/pause`
        );
        return request.data;
    } catch (error) {
        return {
            status: Status.ERROR,
            error: "Error while pause export task",
        };
    }
};

export const exportTaskScheduleContinue = async (taskuid: string) => {
    try {
        const request = await authorizedUserApiInstance.post<BaseResponseError>(
            `external/${taskuid}/continue`
        );
        return request.data;
    } catch (error) {
        return {
            status: Status.ERROR,
            error: "Error while continue export task",
        };
    }
};
