import { K8sCoreV1Api } from "./config.js";

export const createService = async (sandboxId) => {

    const serviceManifest = {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
            name: `sandbox-service-${sandboxId}`,
            labels: {
                sandbox: sandboxId
            }
        },
        spec: {
            selector: {
                sandbox: sandboxId
            },
            ports: [
                {
                    name: "http",
                    port: 80,
                    targetPort: 5173,
                    protocol: "TCP"
                },
                {
                    name: "agent-http",
                    port: 3000,
                    targetPort: 3000,
                    protocol: "TCP"
                }
            ],
            type: "ClusterIP"
        }
    }

    const response = await K8sCoreV1Api.api.createNamespacedService("default", serviceManifest);
    return response;
} 