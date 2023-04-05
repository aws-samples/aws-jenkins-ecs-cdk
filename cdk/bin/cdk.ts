#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkPipelineStack } from "../lib/cdk-pipeline-stack";
import { AwsSolutionsChecks } from 'cdk-nag';
import { NagSuppressions } from 'cdk-nag';

const app = new cdk.App();
const jenkinsStack = new CdkPipelineStack(app, "jenkins-on-ecs-stack", {
  stackName: "jenkins-iac-dev",
  description: "Jenkins Application Controller and Agent on ECS Fargate, deployed as Configuration as Code",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
});

cdk.Aspects.of(app).add(new AwsSolutionsChecks());
NagSuppressions.addStackSuppressions(jenkinsStack, [
  { id: 'AwsSolutions-S1', reason: 'CDK construct does not provide a way to enable logging for S3 Bucket managed by Code Pipeline: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html' },
  { id: 'AwsSolutions-IAM5', reason: '1/Default policies for code pipeline and these are resourced to s3 bucket, account and CDK limits to customize the default policies: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html, 2/ecr:GetAuthorizationToken does not allow to scope to resource' },
  { id: 'AwsSolutions-CB3', reason: 'Building Docker Images for Jenkins Controller and Agent requires docker daemon on the code build instance' },  
  { id: 'AwsSolutions-CB4', reason: 'CodeBuildStep does not provide a way to specify KMS Key for encryption: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodeBuildStepProps.html' },  
]);