import {
  paperclipCloudConnectorEnrollmentStatus,
  type ThinkingMachCloudConnectorEnrollmentStatus,
} from "./paperclip-cloud-connector-enrollment.js";
import {
  createThinkingMachCloudConnector,
  paperclipCloudConnectorConfigFromEnv,
} from "./paperclip-cloud-connector.js";

export async function reconcileThinkingMachCloudConnectorEnrollmentStatus(
  env: NodeJS.ProcessEnv = process.env,
  request: typeof fetch = fetch,
): Promise<ThinkingMachCloudConnectorEnrollmentStatus> {
  const local = paperclipCloudConnectorEnrollmentStatus(env);
  if (!local.configured) return local;
  const config = paperclipCloudConnectorConfigFromEnv(env);
  if (!config) return { ...local, configured: false, status: "not_configured" };
  try {
    const status = await createThinkingMachCloudConnector({ config, request }).getInstanceStatus();
    if (status === "active") return { ...local, configured: true, status: "active" };
    if (status === "suspended") return { ...local, configured: false, status: "suspended" };
    return { ...local, configured: false, status: "not_configured" };
  } catch {
    return { ...local, configured: false, status: "unverified" };
  }
}
