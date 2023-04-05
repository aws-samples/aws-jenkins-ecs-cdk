import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Cdk from '../lib/cdk-pipeline-stack';

test('CDK Pipeline Stack', () => {
    const stackName = "CDKPipelineStack";

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
    const stack = new Cdk.CdkPipelineStack(app, 'CDKPipelineStack');

    // THEN
    const template = Template.fromStack(stack);

    // Assert Code Commit Repo
    template.resourceCountIs("AWS::CodeCommit::Repository", 1);
    template.hasResourceProperties("AWS::CodeCommit::Repository", {
        RepositoryName: stackName,
    });

    // Assert Code Pipeline
    template.resourceCountIs("AWS::CodePipeline::Pipeline", 1);
    template.hasResourceProperties("AWS::CodePipeline::Pipeline", {
        Name: `${stackName}-pipeline`,
    });

    // Assert Code Build Project
    template.resourceCountIs("AWS::CodeBuild::Project", 3);
    template.hasResourceProperties("AWS::CodeBuild::Project", {
        "Environment": {
            "ComputeType": "BUILD_GENERAL1_MEDIUM",
            "PrivilegedMode": false,
            "Type": "LINUX_CONTAINER"
        },
    });

});
