const { Client, KubeConfig } = require('kubernetes-client');
const Request = require('kubernetes-client/backends/request');

const namespace = process.env.NAMESPACE || 'default';

async function main() {
    let kubeclient;
    try {
        const kubeconfig = new KubeConfig();

        if (process.env.NODE_ENV === 'production') {
            kubeconfig.loadFromCluster();
        } else {
            kubeconfig.loadFromDefault();
        }

        const backend = new Request({ kubeconfig });

        kubeclient = new Client({ backend });
        await kubeclient.loadSpec();
    } catch (e) {
        console.error(e);
    }

    // get pods
    const pods = await kubeclient.apis.apps.v1.namespaces(namespace).deployments.get();

    console.log(pods);
}

main();