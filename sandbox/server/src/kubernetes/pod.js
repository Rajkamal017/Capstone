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
            restartPolicy: "Never",
            containers: [
                {
                    image: "sandbox-template:latest",
                    imagePullPolicy: "Never",
                    name: "sandbox-container",
                    ports: [{
                        containerPort: 5173,
                        name: "http"
                    }],
                    env: [
                        {
                            name: "NODE_ENV",
                            value: "development"
                        }
                    ],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    livenessProbe: {
                        httpGet: {
                            path: "/",
                            port: 5173
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 10,
                        timeoutSeconds: 5
                    },
                    readinessProbe: {
                        httpGet: {
                            path: "/",
                            port: 5173
                        },
                        initialDelaySeconds: 20,
                        periodSeconds: 5,
                        timeoutSeconds: 3
                    }
                }
            ]
        }
    }

    const response = await K8sCoreV1Api.api.createNamespacedPod("default", podManifest);
    return response;

}