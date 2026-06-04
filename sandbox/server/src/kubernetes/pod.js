import { K8sCoreV1Api } from "./config.js";


export async function createPod(sandboxId) {

    const podManifest = {
        apiVersion: "v1",
        kind: "Pod",
        metadata: {
            name: `sandbox-pod-${sandboxId}`,
            labels: {
                app: "sandbox",
                sandbox: sandboxId
            }
        },
        spec: {
            containers: [
                {
                    image: "sandbox-template:latest",
                    imagePullPolicy: "IfNotPresent",
                    name: "sandbox-container",
                    ports: [{
                        containerPort: 5173, name: "http"
                    }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    }
                }
            ]
        }
    }

    const response = await K8sCoreV1Api.api.createNamespacedPod("default", podManifest);
    return response;

}