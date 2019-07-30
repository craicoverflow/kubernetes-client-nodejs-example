const { Client, KubeConfig } = require('kubernetes-client');
const Request = require('kubernetes-client/backends/request');

const deploymentManifest = require('./nginx-deployment.json');

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

    // Create a deployment
    try {
        const createdDeployment = await kubeclient.apis.apps.v1.namespaces(namespace).deployments.post({ body: deploymentManifest });
        console.log('Deployment created:', createdDeployment);
    } catch (e) {
        console.error(e);
    }

    const labels = {
        metadata: {
            labels: {
                environment: 'DEVELOPMENT'
            }
        }
    };

    // Modify the deployment by adding new labels
    try {
        const patched = await kubeclient.apis.apps.v1.namespaces(namespace).deployments(deploymentManifest.metadata.name).patch({ body: labels });
        console.log('Deployment modified:', patched.body.metadata);
    } catch (e) {
        console.error(e);
    }

    try {
        const updated = await kubeclient.apis.apps.v1.namespaces(namespace).deployments(deploymentManifest.metadata.name).put({ body: deploymentManifest });
        console.log('Deployment updated:', updated);
    } catch (e) {
        console.error(e);
    }

    // Get a single deployment by its name
    try {
        const deployment = await kubeclient.apis.apps.v1.namespaces(namespace).deployments(deploymentManifest.metadata.name).get();
        console.log('Deployment:', deployment);
    } catch (e) {
        console.log(e);
    }

    // Get all deployments
    try {
        const deployments = await kubeclient.apis.apps.v1.namespaces(namespace).deployments.get();
        console.log('Deployments:', deployments);
    } catch (e) {
        console.log(e);
    }

    try {
        const deployments = await kubeclient.apis.apps.v1.namespaces(namespace).deployments.get({ qs: { labelSelector: 'app=nginx' } });
        console.log('Deployments (query parameters):', deployments);
    } catch (e) {
        console.log(e);
    }


    // All namespaces
    try {
        const deployments = await kubeclient.apis.apps.v1.deployments.get();
        console.log('Deployments (all namespaces):', deployments);
    } catch (e) {
        console.log(e);
    }

    try {
        const createdDeployment = await kubeclient.apis.apps.v1.namespaces(namespace).deployments.post({ body: deploymentManifest });

        console.log('Deployment created:', createdDeployment);
    } catch (err) {

        if (err.statusCode === 409) {
            const createdDeployment = await kubeclient.apis.apps.v1.namespaces(namespace).deployments(deploymentManifest.metadata.name).put({ body: deploymentManifest });

            console.log('Deployment updated:', createdDeployment);
        }
    }

    // Delete the deployment
    try {
        const removed = await kubeclient.apis.apps.v1.namespaces(namespace).deployments(deploymentManifest.metadata.name).delete();
        console.log('Deployment deleted:', removed);
    } catch (e) {
        console.error(e);
    }

    const deploymentStream = await kubeclient.apis.apps.v1.watch.namespaces(namespace).deployments.getObjectStream();
    deploymentStream.on('data', event => {
        console.log(event);
    });
}

main();