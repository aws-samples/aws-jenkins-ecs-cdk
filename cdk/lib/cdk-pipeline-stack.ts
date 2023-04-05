import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CdkApp } from "./cdk-app";
import { CdkUtil} from "./cdk-util";
import { pipelines, StackProps } from "aws-cdk-lib";
import { CdkPipelineECRStage } from "./cdk-pipeline-ecr-stage";
import { CdkPipelineInfraStage } from "./cdk-pipeline-infra-stage";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Cache, LocalCacheMode } from "aws-cdk-lib/aws-codebuild";

export class CdkPipelineStack extends cdk.Stack {
  private jenkinsControllerName: string;
  private jenkinsControllerImageTagParameterName: string;
  private jenkinsAgentName: string;
  private jenkinsAgentImageTagParameterName: string;
  private jenkinsPrivateRootCA: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /************************************************************************/
    /* Get CDK Context Values
    /************************************************************************/
    const util = new CdkUtil(this);
    this.jenkinsControllerName = util.getCdkContextValue("ctxJenkinsControllerName");
    this.jenkinsControllerImageTagParameterName = util.getCdkContextValue("ctxJenkinsControllerImageTagParameterName");
    this.jenkinsAgentName = util.getCdkContextValue("ctxJenkinsAgentName");
    this.jenkinsAgentImageTagParameterName = util.getCdkContextValue("ctxJenkinsAgentImageTagParameterName");
    this.jenkinsPrivateRootCA = util.getCdkContextValue("ctxJenkinsPrivateRootCAParameterName");

    /************************************************************************/
    /* Code Commit Repo 
    /************************************************************************/
    const repo = new codecommit.Repository(this, `${this.stackName}-repo`, {
      repositoryName: this.stackName,
      description: "Repository for Jenkins Application Code and Infrastructure",
    });

    /************************************************************************/
    /* Create SSM Parameters for storing Docker Image Versions
    /************************************************************************/
    new ssm.StringParameter(this, `${this.stackName}-controller-docker-image-version`, {
      parameterName: this.jenkinsControllerImageTagParameterName,
      stringValue: 'latest',
    });

    new ssm.StringParameter(this, `${this.stackName}-agent-docker-image-version`, {
      parameterName: this.jenkinsAgentImageTagParameterName,
      stringValue: 'latest',
    });

    /************************************************************************/
    /* Code Pipeline 
    /************************************************************************/
    const pipeline = new CodePipeline(this, `${this.stackName}-pipeline`, {
      pipelineName: `${this.stackName}-pipeline`,
      selfMutation: false,
      crossAccountKeys: false,
      synth: new CodeBuildStep(`${this.stackName}-synth`, {
        projectName: `${this.stackName}-synth`,
        input: CodePipelineSource.codeCommit(repo, "main"),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["cd cdk", "npm ci", "npm run test", "npm run build", "npx cdk synth"],
        primaryOutputDirectory: "cdk/cdk.out",
        buildEnvironment: {
          computeType: codebuild.ComputeType.MEDIUM,
        },
      }),
    });

    /************************************************************************/
    /* Code Build Role  
    /************************************************************************/
    const buildRole = new iam.Role(this, `${this.stackName}-build-role`, {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      description: `${this.stackName}-build-role`,
      inlinePolicies: {
        "jenkins-code-build-policy": new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "ssm:GetParameter",
                "ssm:PutParameter"
              ],
              resources: [
                `arn:${this.partition}:ssm:${this.region}:${this.account}:parameter${this.jenkinsControllerImageTagParameterName}`,
                `arn:${this.partition}:ssm:${this.region}:${this.account}:parameter${this.jenkinsAgentImageTagParameterName}`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["secretsmanager:GetSecretValue"],
              resources: [
                `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:dockerhub_credentials`,
                `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:${this.jenkinsPrivateRootCA}*`
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["ecr:GetAuthorizationToken"],
              resources: ["*"],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetRepositoryPolicy",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "ecr:DescribeImages",
                "ecr:BatchGetImage",
                "ecr:GetLifecyclePolicy",
                "ecr:GetLifecyclePolicyPreview",
                "ecr:ListTagsForResource",
                "ecr:DescribeImageScanFindings",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage",
              ],
              resources: [
                `arn:${this.partition}:ecr:${this.region}:${this.account}:repository/jenkins*`,
              ],
            }),
          ],
        }),
      },
    });

    /************************************************************************/
    /* Code Build and Push to ECR Stage  
    /************************************************************************/
    const app = new CdkApp(this);
    const buildECRImage = new CdkPipelineECRStage(
      this,
      `${this.stackName}-build-image`
    );
    pipeline.addStage(buildECRImage, {
      post: [
        new pipelines.CodeBuildStep(`${this.stackName}-build-controller`, {
          projectName: `${this.stackName}-build-controller`,
          partialBuildSpec: codebuild.BuildSpec.fromObject(
            app.getBuildSpec("jenkins/controller", this.jenkinsControllerImageTagParameterName, this.jenkinsPrivateRootCA)
          ),
          commands: ["echo building jenkins controller image"],
          buildEnvironment: {
            buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
            computeType: codebuild.ComputeType.MEDIUM,
            privileged: true,
            environmentVariables: app.getBuildEnvironment(this.jenkinsControllerName),
          },
          role: buildRole,
          cache: Cache.local(LocalCacheMode.DOCKER_LAYER)
        }),
        new pipelines.CodeBuildStep(`${this.stackName}-build-agent`, {
          projectName: `${this.stackName}-build-agent`,
          partialBuildSpec: codebuild.BuildSpec.fromObject(
            app.getBuildSpec("jenkins/agent", this.jenkinsAgentImageTagParameterName, this.jenkinsPrivateRootCA)
          ),
          commands: ["echo building jenkins agent image"],
          buildEnvironment: {
            buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
            computeType: codebuild.ComputeType.MEDIUM,
            privileged: true,
            environmentVariables: app.getBuildEnvironment(this.jenkinsAgentName),
          },
          role: buildRole,
          cache: Cache.local(LocalCacheMode.DOCKER_LAYER)
        }),
      ],
    });

    /************************************************************************/
    /* Code Deploy Stage  
    /************************************************************************/
    const deploy = new CdkPipelineInfraStage(this, `${this.stackName}-deploy`);
    pipeline.addStage(deploy);

    /************************************************************************/
    /* Code Deploy Stage  
    /************************************************************************/
    new cdk.CfnOutput(this, "CodeCommitRepositoryUrl", {
      value: repo.repositoryCloneUrlHttp,
    });
  }
}
