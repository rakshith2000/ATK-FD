import serviceNowApiClient from '@/api/axios-clients/service-now-api/service-now-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import type { SnowTicket } from '@/shared/modules/servicenow/types/ticket';

export type ServiceNowIncident = SnowTicket;

const PAGE_SIZE = 1000;

export const incidentStatsByPriorityAndGroupByState = async ({
    priorities,
    assignment_groups,
    assigned_to,
    states,
    dateRange,
    categories,
}: {
    priorities: number[];
    assignment_groups?: string[];
    assigned_to?: string;
    states?: number[];
    categories?: string[];
    dateRange?: { start: string; end: string };
}): Promise<Array<ServiceNowIncident>> => {
    return withApiResponseHandler<Array<ServiceNowIncident>>(async () => {
        const allRecords: ServiceNowIncident[] = [];
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
        if (categories && categories.length > 0) {
            queryParts.push(`categoryIN${categories.join(',')}`);
        }
        if (dateRange?.start && dateRange?.end) {
            queryParts.push(`sys_created_onBETWEENjavascript:gs.dateGenerate('${dateRange.start}','00:00:00')@javascript:gs.dateGenerate('${dateRange.end}','23:59:59')`);
        }

        const query = queryParts.join('^');

        while (true) {
            const response = await serviceNowApiClient.get<{ result: Array<ServiceNowIncident> }>(
                `${appConfig.serviceNow.api.incidentTable}?sysparm_display_value=all&sysparm_fields=sys_id,number,short_description,priority,urgency,impact,state,category,assignment_group,assigned_to,caller_id,sys_created_on,sys_updated_on,active,problem_id,closed_at,resolved_at,made_sla,reopen_count,severity,problem&sysparm_query=${query}&sysparm_limit=${PAGE_SIZE}&sysparm_offset=${offset}`,
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
