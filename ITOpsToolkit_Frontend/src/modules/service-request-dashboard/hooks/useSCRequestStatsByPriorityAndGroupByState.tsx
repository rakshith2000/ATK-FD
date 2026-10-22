import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/modules/auth/hooks/useAuth';
import { fetchSnowUserMemberOfAssignmentGroupsByUserSysId } from '@/shared/modules/servicenow/services/fetch-snow-user-member-of-assignment-groups-by-user-sys-id';
import { SCRequestStatsByPriorityAndGroupByState, type ServiceNowSCRequest } from '../services/service_request-stats.service';

type GroupWiseStats = {
    count: number;
    value: string;
    label: string;
};

export interface SCRequestStatsResult {
    total_count: number;
    state_stats: Array<GroupWiseStats>;
    priority_stats: Array<GroupWiseStats>;
    group_stats: Array<GroupWiseStats>;
    combined_state_priority_stats: Array<{
        state: string;
        stateVal: string;
        [priority: string]: string | number;
    }>;
    raw_sc_requests: Array<ServiceNowSCRequest>;
}

export function useSCRequestStatsByPriorityAndGroupByState({
    priorities,
    states,
    groups,
    context = 'me',
    dateRange,
}: {
    priorities: number[];
    states?: string[];
    groups: string[];
    context?: 'org' | 'me';
    dateRange?: { start: string; end: string };
}) {
    const { getUserSnowDetails } = useAuth();

    const queryKey = [
        'sc-request-stats-by-priority-and-group-by-state',
        JSON.stringify(priorities),
        JSON.stringify(states),
        JSON.stringify(dateRange),
        context,
        JSON.stringify(groups),
    ];

    const query = useQuery<Array<ServiceNowSCRequest>, Error, SCRequestStatsResult>({
        queryKey: [...queryKey],
        queryFn: async () => {
            const userSnowDetails = await getUserSnowDetails();
            const userMemberOfAssignmentGroups = await fetchSnowUserMemberOfAssignmentGroupsByUserSysId({ sys_id: userSnowDetails.sys_id });
            const userGroupValues = userMemberOfAssignmentGroups.map((g) => g.value).filter(Boolean);

            if (context === 'me') {
                return SCRequestStatsByPriorityAndGroupByState({
                    priorities,
                    states,
                    assigned_to: userSnowDetails.sys_id,
                    assignment_groups: groups.length > 0 ? groups : userGroupValues.length > 0 ? userGroupValues : undefined,
                    dateRange,
                });
            }

            // context === 'org': show tickets for user's assignment groups only
            if (groups.length > 0) {
                return SCRequestStatsByPriorityAndGroupByState({
                    priorities,
                    states,
                    assignment_groups: groups,
                    dateRange,
                });
            }

            if (userGroupValues.length === 0) {
                return [];
            }

            return SCRequestStatsByPriorityAndGroupByState({
                priorities,
                states,
                assignment_groups: userGroupValues,
                dateRange,
            });
        },
        select: (data) => {
            const allData = data ?? [];
            const filteredData = allData.filter((scRequest) => {
                if (!groups || groups.length === 0) return true;
                return groups.includes(scRequest?.assignment_group?.value ?? '');
            });

            const total_count = filteredData.length;

            const stateCounts: Record<string, { label: string; count: number }> = {};
            const priorityCounts: Record<string, { label: string; count: number }> = {};
            const groupCounts: Record<string, { label: string; count: number }> = {};
            const combinedStatePriorityMap: Record<string, { state: string; stateVal: string; [priority: string]: string | number }> = {};

            filteredData.forEach((scRequest) => {
                const stateVal = scRequest.request_state?.value || scRequest.state?.value || 'unknown';
                const stateLabel = scRequest.request_state?.display_value || scRequest.state?.display_value || 'Unknown';
                if (!stateCounts[stateVal]) {
                    stateCounts[stateVal] = { label: stateLabel, count: 0 };
                }
                stateCounts[stateVal].count += 1;

                const priorityVal = scRequest.priority?.value || 'unknown';
                const priorityLabel = scRequest.priority?.display_value || 'Unknown';
                if (!priorityCounts[priorityVal]) {
                    priorityCounts[priorityVal] = { label: priorityLabel, count: 0 };
                }
                priorityCounts[priorityVal].count += 1;

                if (!combinedStatePriorityMap[stateVal]) {
                    combinedStatePriorityMap[stateVal] = { state: stateLabel, stateVal: stateVal };
                }
                const currentValVal = combinedStatePriorityMap[stateVal][priorityVal] || 0;
                combinedStatePriorityMap[stateVal][priorityVal] = Number(currentValVal) + 1;
            });

            // Populate group_stats from allData so assignment group filter dropdown retains all groups
            allData.forEach((scRequest) => {
                const groupVal = scRequest.assignment_group?.value;
                const groupLabel = scRequest.assignment_group?.display_value;
                if (groupVal && groupLabel) {
                    if (!groupCounts[groupVal]) {
                        groupCounts[groupVal] = { label: groupLabel, count: 0 };
                    }
                    groupCounts[groupVal].count += 1;
                }
            });

            const state_stats = Object.entries(stateCounts).map(([value, info]) => ({
                value,
                label: info.label,
                count: info.count,
            }));

            const priority_stats = Object.entries(priorityCounts).map(([value, info]) => ({
                value,
                label: info.label,
                count: info.count,
            }));

            const group_stats = Object.entries(groupCounts).map(([value, info]) => ({
                value,
                label: info.label,
                count: info.count,
            }));

            const combined_state_priority_stats = Object.values(combinedStatePriorityMap);

            return {
                total_count,
                state_stats,
                group_stats,
                priority_stats,
                combined_state_priority_stats,
                raw_sc_requests: filteredData || [],
            };
        },
    });

    return { ...query, queryKey };
}
