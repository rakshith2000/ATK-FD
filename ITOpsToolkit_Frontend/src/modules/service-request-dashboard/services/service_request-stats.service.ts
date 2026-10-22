import serviceNowApiClient from '@/api/axios-clients/service-now-api/service-now-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import type { SnowTicket } from '@/shared/modules/servicenow/types/ticket';

export type ServiceNowSCRequest = SnowTicket;

export const SCRequestStatsByPriorityAndGroupByState = async ({
    priorities,
    assignment_groups,
    assigned_to,
    states,
    dateRange,
}: {
    priorities: number[];
    assignment_groups?: string[];
    assigned_to?: string;
    states?: string[];
    dateRange?: { start: string; end: string };
}): Promise<Array<ServiceNowSCRequest>> => {
    return withApiResponseHandler<Array<ServiceNowSCRequest>>(async () => {
        const queryParts: string[] = [];

        if (states && states.length > 0) {
            queryParts.push(`request_stateIN${states.join(',')}`);
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

        const response = await serviceNowApiClient.get<{ result: Array<ServiceNowSCRequest> }>(
            `${appConfig.serviceNow.api.scRequestTable}?sysparm_display_value=all&sysparm_fields=sys_id,number,short_description,priority,urgency,impact,request_state,state,assignment_group,assigned_to,sys_created_on,sys_updated_on,active,closed_at,made_sla,description,requested_for,opened_by,cat_item&sysparm_query=${query}`,
        );

        const resultList = response?.data?.result;
        if (Array.isArray(resultList)) {
            return resultList;
        } else {
            throw new Error('Failed to get the service request stats from Service Now!', {
                cause: {
                    reason: 'response?.data?.result is not an array!',
                },
            });
        }
    });
};
