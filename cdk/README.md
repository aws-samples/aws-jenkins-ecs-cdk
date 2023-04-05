# CDK Project for Building and Deploying Jenkins on ECS Fargate

The `cdk.json` file tells the CDK Toolkit how to execute your app. Default context variables are configured in the file but there are two context variables that you would need to provide that include ctxHostedZoneId and ctxHostedZoneName. Prerequisite for running this project includes an active domain in Route 53.

## Prerequisites
Setup typescript and Install CDK:
```bash
npm install -g typescript
npm install -g aws-cdk
```

## Project Structure

|Class Type | Files  | Tests
|--------------------------|---|---|
|Main Class | bin/cdk.ts |  | 
|Pipeline Main Class | lib/cdk-pipeline-stack.ts | test/cdk-pipeline-stack.test.ts |
|Pipeline Stages | lib/cdk-pipeline-ecr-stage.ts, lib/cdk-pipeline-infra-stage.ts | |
|Stack Classes | lib/cdk-ecr-stack.ts, lib/cdk-infra-stack.ts | test/cdk-ecr-stack.test.ts, test/cdk-infra-stack.test.ts |
|Util Class | lib/cdk-util.ts | test/cdk-util.test.ts |
|App Class | lib/cdk-app.ts | test/cdk-app.test.ts |

## CDK Context Default Variables (cdk.json)
|Usage | Context Variable Name | Default Value | Override Required |  
|--------------------------|---|---|---|
|Jenkins Hosted Zone Id | ctxHostedZoneId | **UPDATEME**  |  **Y** |
|Jenkins Hosted Zone Name | ctxHostedZoneName | **UPDATEME** |   **Y** |
|Jenkins Default JNLP Port | ctxJnlpPort | 50000 |   N |
|Jenkins Domain Name | ctxJenkinsDomainNamePrefix | jenkins-dev  |   N |
|Jenkins Controller Name| ctxJenkinsControllerName | jenkins-controller |   N |
|Jenkins Controller Image Tag Parameter Name | ctxJenkinsControllerImageTagParameterName | /dev/jenkins/controller/docker/image/tag |   N |
|Jenkins Agent Name | ctxJenkinsAgentName | jenkins-agent  |   N |
|Jenkins Controller Image Tag Parameter Name | ctxJenkinsAgentImageTagParameterName | /dev/jenkins/agent/docker/image/tag  |   N |
|Jenkins Admin User Credentials | ctxJenkinsAdminCredentialSecretName | /dev/jenkins/admin/credentials  |   N |
|Jenkins Workload Account Parameter Name | ctxDevTeam1Workload1AWSAccountIdParameterName | /dev/team1/workload1/AWSAccountID  |   N |

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template