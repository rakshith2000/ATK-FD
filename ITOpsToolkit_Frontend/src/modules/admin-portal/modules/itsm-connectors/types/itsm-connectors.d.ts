import type { z } from 'zod';
import type { ITSMConnectorSchema, ITSMConnectorsListResponseSchema, ITSMConnectorConfigSchema } from '../schemas/itsm-connectors.schemas';

export type ITSMConnector = z.infer<typeof ITSMConnectorSchema>;

export type ITSMConnectorsListResponse = z.infer<typeof ITSMConnectorsListResponseSchema>;

export type ITSMConnectorConfig = z.infer<typeof ITSMConnectorConfigSchema>;

export interface GetITSMConnectorConfigRequest {
    itsm_tag: string;
}

export type OnboardITSMConnectorRequest = ITSMConnectorConfig;

export interface OnboardITSMConnectorResponse {
    message: string;
}
export interface DeleteITSMConnectorRequest {
    itsm_tag: string;
}

export interface DeleteITSMConnectorResponse {
    message: string;
}
