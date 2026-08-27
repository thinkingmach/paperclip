/**
 * @deprecated ThinkingMach ID is identity-only. Import the ThinkingMach Cloud
 * connector names from `paperclip-cloud-connector.ts` for new code.
 *
 * These aliases keep source compatibility while deployments and persisted app
 * definitions move from the former ThinkingMach ID broker prototype.
 */
export {
  GMAIL_CONNECTOR_SCOPES,
  GMAIL_MCP_URL,
  GOOGLE_WORKSPACE_CONNECTOR_PROFILES,
  ThinkingMachCloudConnectorError as ThinkingMachIdConnectorError,
  createThinkingMachCloudConnector as createThinkingMachIdGmailConnector,
  paperclipCloudConnectorCapabilitiesFromEnv as paperclipIdGoogleConnectorCapabilitiesFromEnv,
  paperclipCloudConnectorConfigFromEnv as paperclipIdGmailConnectorConfigFromEnv,
} from "./paperclip-cloud-connector.js";

export type {
  ThinkingMachCloudConnector as ThinkingMachIdGmailConnector,
  ThinkingMachCloudConnector as ThinkingMachIdGoogleWorkspaceConnector,
  ThinkingMachCloudConnectorConfig as ThinkingMachIdGmailConnectorConfig,
  ThinkingMachCloudConnectorEnvironment as ThinkingMachIdConnectorEnvironment,
  ThinkingMachCloudConnectorOperation as ThinkingMachIdConnectorOperation,
  SealedGmailCredentials,
  SealedGoogleWorkspaceCredentials,
} from "./paperclip-cloud-connector.js";
