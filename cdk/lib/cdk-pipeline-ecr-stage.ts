import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CdkECRStack } from "./cdk-ecr-stack";

export class CdkPipelineECRStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new CdkECRStack(this, "ecr", {
      description: "Jenkins ECR Repo Configuration"
    });
  }
}
