import { K8sCoreV1Api } from "./config.js";


export async function createPod(sandboxId, projectId) {

    const podManifest = {
        apiVersion: "v1",
        kind: "Pod",
        metadata: {
            name: `sandbox-pod-${sandboxId}`,
            labels: {
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
                },
                {
                    image: "sync-agent",
                    imagePullPolicy: "IfNotPresent",
                    name: "sync-agent-container",
                    ports: [ {containerPort: 4000, name: "http"}],
                    resources: {
                        limits: { cpu: "500m", memory: "500Mi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ],
                    env: [
                        {
                            name: "PROJECT_ID",
                            value: projectId
                        },
                        {
                            name: "AWS_ACCESS_KEY_ID",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_ACCESS_KEY_ID"
                                }
                            }
                        },
                        {
                            name: "AWS_SECRET_ACCESS_KEY",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_SECRET_ACCESS_KEY"
                                }
                            }
                        },
                        {
                            name: "AWS_REGION",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_REGION"
                                }   
                            }
                        }
                    ]
                }
            ]
        }
    }

    const response = await K8sCoreV1Api.createNamespacedPod({
        namespace: "default",
        body: podManifest
    });

    return response;
}

export async function deletePod(sandboxId) {
    const response = await K8sCoreV1Api.deleteNamespacedPod({
        name: `sandbox-pod-${sandboxId}`,
        namespace: "default",
        gracePeriodSeconds: 0
    });
    return response;
}
