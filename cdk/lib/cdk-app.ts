import { Stack } from "aws-cdk-lib";
import { BuildEnvironmentVariableType } from "aws-cdk-lib/aws-codebuild";

export class CdkApp {
  private stack: Stack;

  constructor(stack: Stack) {
    this.stack = stack;
  }
  /************************************************************************/
  /* generate buildspec.yaml
  /************************************************************************/
  public getBuildSpec(appName: string, ssmImageTagParameter: string, secretPrivateRootCAId: string) {
    return {
      version: "0.2",
      env: {
        variables: {
          IMAGE_TAG: "latest",
        }
      },
      phases: {
        install: {
          commands: [
            "echo running install commands...",
            "COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-8)",
            "IMAGE_TAG=${COMMIT_HASH:=latest}",
            `CURRENT_IMAGE_DIGEST=$(aws ssm get-parameter --name ${ssmImageTagParameter} --query "Parameter.Value" --output text --region $AWS_DEFAULT_REGION)`,
            `PRIVATE_ROOT_CA=$(aws secretsmanager get-secret-value --secret-id ${secretPrivateRootCAId} --query "SecretString" --output text --region $AWS_DEFAULT_REGION)`
          ],
        },
        pre_build: {
          commands: [
            "echo Logging in to Amazon ECR...",
            "echo $DOCKER_USER_PASSWORD | docker login -u $DOCKER_USER_NAME --password-stdin",
            "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
          ],
        },
        build: {
          commands: [
            "echo Build started on `date`",
            `cd ${appName}`,
            "docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$CURRENT_IMAGE_DIGEST || true",
            "docker build --build-arg PRIVATE_ROOT_CA=$PRIVATE_ROOT_CA --cache-from $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$CURRENT_IMAGE_DIGEST -t $IMAGE_REPO_NAME:$IMAGE_TAG .",
            "docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG"
          ],
        },
        post_build: {
          commands: [
            "echo Running post build steps...",
            "docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG",
            "NEW_IMAGE_DIGEST=$(echo $(docker inspect $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG) | jq '.[].RepoDigests' | jq '.[]' | cut -d ':' -f 2 | cut -c 1-12)",
            "if [ $NEW_IMAGE_DIGEST = $CURRENT_IMAGE_DIGEST ] ; then echo No docker image changes; fi;",
            `if [ $NEW_IMAGE_DIGEST != $CURRENT_IMAGE_DIGEST ] ; then docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$NEW_IMAGE_DIGEST; docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$NEW_IMAGE_DIGEST; aws ssm put-parameter --name ${ssmImageTagParameter} --type String --value $NEW_IMAGE_DIGEST --overwrite; fi;`
          ],
        },
      }
    };
  }

  /************************************************************************/
  /* prepare build environment variables
  /************************************************************************/
  public getBuildEnvironment(repoName: string) {
    return {
      AWS_ACCOUNT_ID: {
        value: this.stack.account,
      },
      AWS_DEFAULT_REGION: {
        value: this.stack.region,
      },
      IMAGE_REPO_NAME: {
        value: repoName,
      },
      IMAGE_TAG: {
        value: "latest",
      },
      DOCKER_USER_NAME: {
        type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        value: "dockerhub_credentials:username",
      },
      DOCKER_USER_PASSWORD: {
        type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        value: "dockerhub_credentials:password",
      },
    };
  }
}
