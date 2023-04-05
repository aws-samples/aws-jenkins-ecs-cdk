import assert = require('assert');
import * as cdk from 'aws-cdk-lib';
import * as CdkPipelineStack from '../lib/cdk-pipeline-stack';
import { CdkUtil } from '../lib/cdk-util';

test("CDK Util Context Values Exists", () => {
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
    let stack = new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack');

    // THEN
    let cdkUtil = new CdkUtil(stack);

    // ASSERT
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJnlpPort"), 50000)
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxHostedZoneName"), "example.com")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJenkinsDomainNamePrefix"), "jenkins-test")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJenkinsControllerName"), "jenkins-controller")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJenkinsControllerImageTagParameterName"), "/dev/jenkins/controller/docker/image/tag")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJenkinsAgentName"), "jenkins-agent")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJenkinsAgentImageTagParameterName"), "/dev/jenkins/agent/docker/image/tag")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJenkinsAdminCredentialSecretName"), "/dev/jenkins/admin/credentials")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxDevTeam1Workload1AWSAccountIdParameterName"), "/dev/team1/workload1/AWSAccountID")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxACMPCACertificateArnParameterName"), "/dev/jenkins/acmpca/certificateAuthorityArn")
    assert.strictEqual(cdkUtil.getCdkContextValue("ctxJenkinsPrivateRootCAParameterName"), "/dev/jenkins/rootCA")
});

test("CDK Util Context Value ctxJnlpPort missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
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

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJnlpPort cannot be null");

});

test("CDK Util Context Value ctxHostedZoneName missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
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

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxHostedZoneName cannot be null");

});

test("CDK Util Context Value ctxJenkinsDomainNamePrefix missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
        "ctxHostedZoneName": "example.com",
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

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJenkinsDomainNamePrefix cannot be null");

});

test("CDK Util Context Value ctxJenkinsControllerName missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
        "ctxHostedZoneName": "example.com",
        "ctxJenkinsDomainNamePrefix": "jenkins-test",
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

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJenkinsControllerName cannot be null");

});

test("CDK Util Context Value ctxJenkinsControllerImageTagParameterName missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
        "ctxHostedZoneName": "example.com",
        "ctxJenkinsDomainNamePrefix": "jenkins-test",
        "ctxJenkinsControllerName": "jenkins-controller",
        "ctxJenkinsAgentName": "jenkins-agent",
        "ctxJenkinsAgentImageTagParameterName": "/dev/jenkins/agent/docker/image/tag",
        "ctxJenkinsAdminCredentialSecretName": "/dev/jenkins/admin/credentials",
        "ctxDevTeam1Workload1AWSAccountIdParameterName": "/dev/team1/workload1/AWSAccountID",
        "ctxACMPCACertificateArnParameterName": "/dev/jenkins/acmpca/certificateAuthorityArn",
        "ctxACMSelfSignedCertificateArnParameterName": "/dev/jenkins/acm/selfSignedCertificateArn",
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJenkinsControllerImageTagParameterName cannot be null");

});

test("CDK Util Context Value ctxJenkinsAgentName missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
        "ctxHostedZoneName": "example.com",
        "ctxJenkinsDomainNamePrefix": "jenkins-test",
        "ctxJenkinsControllerName": "jenkins-controller",
        "ctxJenkinsControllerImageTagParameterName": "/dev/jenkins/controller/docker/image/tag",
        "ctxJenkinsAgentImageTagParameterName": "/dev/jenkins/agent/docker/image/tag",
        "ctxJenkinsAdminCredentialSecretName": "/dev/jenkins/admin/credentials",
        "ctxDevTeam1Workload1AWSAccountIdParameterName": "/dev/team1/workload1/AWSAccountID",
        "ctxACMPCACertificateArnParameterName": "/dev/jenkins/acmpca/certificateAuthorityArn",
        "ctxACMSelfSignedCertificateArnParameterName": "/dev/jenkins/acm/selfSignedCertificateArn",
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJenkinsAgentName cannot be null");

});

test("CDK Util Context Value ctxJenkinsAgentImageTagParameterName missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
        "ctxHostedZoneName": "example.com",
        "ctxJenkinsDomainNamePrefix": "jenkins-test",
        "ctxJenkinsControllerName": "jenkins-controller",
        "ctxJenkinsControllerImageTagParameterName": "/dev/jenkins/controller/docker/image/tag",
        "ctxJenkinsAgentName": "jenkins-agent",
        "ctxJenkinsAdminCredentialSecretName": "/dev/jenkins/admin/credentials",
        "ctxDevTeam1Workload1AWSAccountIdParameterName": "/dev/team1/workload1/AWSAccountID",
        "ctxACMPCACertificateArnParameterName": "/dev/jenkins/acmpca/certificateAuthorityArn",
        "ctxACMSelfSignedCertificateArnParameterName": "/dev/jenkins/acm/selfSignedCertificateArn",
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJenkinsAgentImageTagParameterName cannot be null");

});

test("CDK Util Context Value ctxJenkinsAdminCredentialSecretName missing Throws Error", () => {
    //GIVEN
    const app = new cdk.App({context: {
        "ctxJnlpPort": 50000,
        "ctxHostedZoneName": "example.com",
        "ctxJenkinsDomainNamePrefix": "jenkins-test",
        "ctxJenkinsControllerName": "jenkins-controller",
        "ctxJenkinsControllerImageTagParameterName": "/dev/jenkins/controller/docker/image/tag",
        "ctxJenkinsAgentName": "jenkins-agent",
        "ctxJenkinsAgentImageTagParameterName": "/dev/jenkins/agent/docker/image/tag",
        "ctxDevTeam1Workload1AWSAccountIdParameterName": "/dev/team1/workload1/AWSAccountID",
        "ctxACMPCACertificateArnParameterName": "/dev/jenkins/acmpca/certificateAuthorityArn",
        "ctxACMSelfSignedCertificateArnParameterName": "/dev/jenkins/acm/selfSignedCertificateArn",
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJenkinsAdminCredentialSecretName cannot be null");

});

test("CDK Util Context Value ctxDevTeam1Workload1AWSAccountIdParameterName missing Throws Error", () => {
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
        "ctxACMPCACertificateArnParameterName": "/dev/jenkins/acmpca/certificateAuthorityArn",
        "ctxACMSelfSignedCertificateArnParameterName": "/dev/jenkins/acm/selfSignedCertificateArn",
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxDevTeam1Workload1AWSAccountIdParameterName cannot be null");

});

test("CDK Util Context Value ctxACMPCACertificateArnParameterName missing Throws Error", () => {
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
        "ctxACMSelfSignedCertificateArnParameterName": "/dev/jenkins/acm/selfSignedCertificateArn",
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxACMPCACertificateArnParameterName cannot be null");

});

test("CDK Util Context Value ctxACMSelfSignedCertificateArnParameterName missing Throws Error", () => {
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
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA",
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxACMSelfSignedCertificateArnParameterName cannot be null");

});

test("CDK Util Context Value ctxJenkinsPrivateRootCAParameterName missing Throws Error", () => {
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
        "ctxACMCertMode": "self-signed"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxJenkinsPrivateRootCAParameterName cannot be null");

});

test("CDK Util Context Value ctxACMCertMode missing Throws Error", () => {
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
        "ctxJenkinsPrivateRootCAParameterName": "/dev/jenkins/rootCA"
    }});

    // WHEN, THEN
    expect(() => {
        new CdkPipelineStack.CdkPipelineStack(app, 'CDKPipelineStack')
    }).toThrowError("ctxACMCertMode cannot be null");

});