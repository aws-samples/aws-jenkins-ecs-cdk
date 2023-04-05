import { Construct } from "constructs";
import { TagStatus } from "aws-cdk-lib/aws-ecr";
import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class CdkECRStack extends cdk.Stack {
  public readonly controllerRepository: ecr.Repository;
  public readonly agentRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /************************************************************************/
    /* Create ECR Repo for Jenkins Controller
    /************************************************************************/
    this.controllerRepository = new ecr.Repository(
      this,
      `${this.stackName}-controller`,
      {
        repositoryName: "jenkins-controller",
        imageScanOnPush: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    /************************************************************************/
    /* Create ECR Repo for Jenkins Agent
    /************************************************************************/
    this.agentRepository = new ecr.Repository(
      this,
      `${this.stackName}-agent`,
      {
        repositoryName: "jenkins-agent",
        imageScanOnPush: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    /************************************************************************/
    /* Add Lifecycle Rules for Controller and Agent repo
    /************************************************************************/
    this.controllerRepository.addLifecycleRule({
      tagStatus: TagStatus.ANY,
      maxImageCount: 10,
    });
    this.controllerRepository.addLifecycleRule({
      tagStatus: TagStatus.UNTAGGED,
      maxImageAge: cdk.Duration.days(1),
    });

    this.agentRepository.addLifecycleRule({
      tagStatus: TagStatus.ANY,
      maxImageCount: 10,
    });
    this.agentRepository.addLifecycleRule({
      tagStatus: TagStatus.UNTAGGED,
      maxImageAge: cdk.Duration.days(1),
    });
  }
}
