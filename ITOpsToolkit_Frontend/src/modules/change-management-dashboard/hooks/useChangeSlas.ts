import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/modules/auth/hooks/useAuth';
import { fetchSnowUserMemberOfAssignmentGroupsByUserSysId } from '@/shared/modules/servicenow/services/fetch-snow-user-member-of-assignment-groups-by-user-sys-id';
import { fetchChangeSlas, type SlaRecord } from '../services/change-sla.service';

export type { SlaRecord };

export interface ChangeSlaResult {
    breached: number;
    atRisk: number;
    compliant: number;
    total: number;
    records: SlaRecord[];
}

export function useChangeSlas(
    filters?: {
        states?: number[];
        priorities?: number[];
        assignment_groups?: string[];
        assigned_to?: string;
        dateRange?: { start: string; end: string };
    },
    context?: 'me' | 'org',
    enabled = true,
) {
    const { getUserSnowDetails } = useAuth();

    return useQuery<SlaRecord[], Error, ChangeSlaResult>({
        queryKey: [
            'change-slas',
            JSON.stringify(filters?.states),
            JSON.stringify(filters?.priorities),
            JSON.stringify(filters?.assignment_groups),
            filters?.assigned_to,
            context,
            JSON.stringify(filters?.dateRange),
        ],
        queryFn: async () => {
            const userSnowDetails = await getUserSnowDetails();
            const userMemberOfAssignmentGroups = await fetchSnowUserMemberOfAssignmentGroupsByUserSysId({ sys_id: userSnowDetails.sys_id });
            const userGroupValues = userMemberOfAssignmentGroups.map((g) => g.value).filter(Boolean);

            const filtersToApply = { ...filters };

            if (context === 'me') {
                filtersToApply.assigned_to = userSnowDetails.sys_id;
                filtersToApply.assignment_groups =
                    filters?.assignment_groups && filters.assignment_groups.length > 0 ? filters.assignment_groups : userGroupValues.length > 0 ? userGroupValues : undefined;
            }

            return fetchChangeSlas(filtersToApply);
        },
        enabled: enabled,
        select: (records) => {
            let breached = 0;
            let atRisk = 0;
            let compliant = 0;

            records.forEach((r) => {
                const pct = parseFloat(r.business_percentage?.value ?? '0');
                if (r.has_breached?.value === 'true') {
                    breached++;
                } else if (pct >= 75) {
                    atRisk++;
                } else {
                    compliant++;
                }
            });

            return { breached, atRisk, compliant, total: records.length, records };
        },
    });
}
