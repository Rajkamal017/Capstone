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
            volumes: [
                {
                    name: "workspace-volume",
                    emptyDir: {}
                }
            ],
            initContainers: [
                {
                    name: "workspace-init", //  Yaha (init-container) = name hain
                    image: "template", // (template) name hain 
                    imagePullPolicy: "IfNotPresent",
                    command: ["sh", "-c", "cp -a /workspace/. /workspace-volume/"],
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace-volume"
                        }
                    ]
                }
            ],
            restartPolicy: "Never",
            containers: [
                {
                    image: "template",
                    imagePullPolicy: "IfNotPresent",
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
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                    
                },

                {
                    image: "agent",
                    imagePullPolicy: "IfNotPresent",
                    name: "agent-container",
                    ports: [{
                        containerPort: 3000,
                        name: "http"
                    }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                }
            ]
        }
    }

    const response = await K8sCoreV1Api.api.createNamespacedPod("default", podManifest);
    return response;

}
