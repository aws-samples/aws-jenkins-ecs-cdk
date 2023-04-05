import assert = require('assert');
import * as cdk from 'aws-cdk-lib';
import { CdkApp } from '../lib/cdk-app';
import * as CdkPipelineStack from '../lib/cdk-pipeline-stack';
import { CdkUtil } from '../lib/cdk-util';
const fs   = require('fs');

test("CDK Prepare Build Spec", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
        "ctxHostedZoneName": "example.com",
        "ctxJenkinsDomainNamePrefix": "jenkins-test",
        "ctxJenkinsControllerName": "jenkins-controller",
        "ctxJenkinsControllerImageTagParameterName": "/dev/jenkins/controller/docker/image/tag",
        "ctxJenkinsAgentName": "jenkins-agent",
        "ctxJenkinsAgentImageTagParameterName": "/dev/jenkins/agent/docker/image/tag",
        "ctxJenkinsAdminCredentialSecretName": "/dev/jenkins/admin/credentials",
        "ctxDevTeam1Workload1AWSAccountIdParameterName": "/dev/team1/workload1/AWSAccountID",
        "ctxACMPCACertificateArnParameterName": "/dev/jenkins/acmpca/certificateAuthorityArn",
        "ctxACMSelfSignedCertificateArnParameterName": "/dev/jenkins/acm/selfSignedCertificateArn",
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN
    const stack = new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack');
    const cdkApp = new CdkApp(stack);
    const controllerBuildSpec = cdkApp.getBuildSpec("jenkins-controller", "/dev/jenkins/controller/docker/image/tag", "/dev/jenkins/rootCA");
    const agentBuildSpec = cdkApp.getBuildSpec("jenkins-agent", "/dev/jenkins/agent/docker/image/tag", "/dev/jenkins/rootCA");

    // THEN
    //console.log(controllerBuildSpec);    
    //console.log(agentBuildSpec.phases.build);

});

