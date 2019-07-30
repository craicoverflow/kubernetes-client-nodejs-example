const { Client, KubeConfig } = require('kubernetes-client');
const Request = require('kubernetes-client/backends/request');

const crd = require('./githubaccount-crd.json');
const customResource = require('./githubaccount-cr.json');

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

    // create the CRD
    try {
        const createCRD = await kubeclient.apis['apiextensions.k8s.io'].v1beta1.customresourcedefinitions.post({ body: crd });
        console.log('CRD created:', createCRD);

        // add CRD endpoints to the client
    } catch (e) {
        console.error(e);
    }

    kubeclient.addCustomResourceDefinition(crd);

    // create a GitHubAccount
    try {
        const createdAccount = await kubeclient.apis[crd.spec.group].v1.namespaces(namespace).githubaccounts.post({ body: customResource });
        console.log('Created GitHubAccount:', createdAccount);
    } catch (e) {
        console.error(e);
    }

    try {
        const githubAccount = await kubeclient.apis[crd.spec.group].v1.namespaces(namespace).githubaccounts(customResource.metadata.name).get();
        console.log('GitHubAccount:', githubAccount);
    } catch (e) {
        console.error(e);
    }

    try {
        const allAccounts = await kubeclient.apis[crd.spec.group].v1.namespaces(namespace).githubaccounts.get();
        console.log('GitHubAccountList:', allAccounts);
    } catch (e) {
        console.error(e);
    }

    try {
        const deleteAccounts = await kubeclient.apis[crd.spec.group].v1.namespaces(namespace).githubaccounts(customResource.metadata.name).delete();
        console.log('Deleted GitHubAccount:', deleteAccounts);
    } catch (e) {
        console.error(e);
    }

    // delete the CRD
    try {
        const deletedCRD = await kubeclient.apis['apiextensions.k8s.io'].v1beta1.customresourcedefinitions(crd.metadata.name).delete();
        console.log('GitHubAccount CRD deleted:', deletedCRD);
    } catch (e) {
        console.error(e);
    }

    const githubAccountStream = await kubeclient.apis[crd.spec.group].v1.watch.namespaces(namespace).githubaccounts.getObjectStream();
    githubAccountStream.on('data', event => {
        console.log(event);
    });
}

main();