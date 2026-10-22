import serviceNowApiClient from '@/api/axios-clients/service-now-api/service-now-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import type { SnowTicket } from '@/shared/modules/servicenow/types/ticket';

export type ServiceNowChangeRequest = SnowTicket;

const PAGE_SIZE = 1000;
const CHANGE_FIELDS =
    'sys_id,number,short_description,priority,state,type,assignment_group,assigned_to,sys_created_on,sys_updated_on,risk,start_date,end_date,closed_at,made_sla,reopen_count';

export const changeStatsByPriorityAndGroupByState = async ({
    priorities,
    assignment_groups,
    assigned_to,
    states,
    dateRange,
}: {
    priorities?: number[];
    assignment_groups?: string[];
    assigned_to?: string;
    states?: number[];
    dateRange?: { start: string; end: string };
}): Promise<Array<ServiceNowChangeRequest>> => {
    return withApiResponseHandler<Array<ServiceNowChangeRequest>>(async () => {
        const allRecords: ServiceNowChangeRequest[] = [];
        let offset = 0;
        const queryParts: string[] = [];

        if (states && states.length > 0) {
            queryParts.push(`stateIN${states.join(',')}`);
        }
        if (priorities && priorities.length > 0) {
            queryParts.push(`priorityIN${priorities.join(',')}`);
        }
        if (assignment_groups && assignment_groups.length > 0) {
            queryParts.push(`assignment_groupIN${assignment_groups.join(',')}`);
        }
        if (assigned_to) {
            queryParts.push(`assigned_to=${assigned_to}`);
        }

        if (dateRange?.start && dateRange?.end) {
            queryParts.push(`sys_created_onBETWEENjavascript:gs.dateGenerate('${dateRange.start}','00:00:00')@javascript:gs.dateGenerate('${dateRange.end}','23:59:59')`);
        }

        const query = queryParts.join('^');

        while (true) {
            const response = await serviceNowApiClient.get<{ result: Array<ServiceNowChangeRequest> }>(
                `${appConfig.serviceNow.api.submitChangeRequest}?sysparm_display_value=all&sysparm_fields=${CHANGE_FIELDS}&sysparm_query=${query}&sysparm_limit=${PAGE_SIZE}&sysparm_offset=${offset}`,
            );

            const page = response?.data?.result;
            if (!Array.isArray(page) || page.length === 0) break;

            allRecords.push(...page);
            if (page.length < PAGE_SIZE) break;
            offset += PAGE_SIZE;
        }

        return allRecords;
    });
};
