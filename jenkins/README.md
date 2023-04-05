# Jenkins Application Controller and Agent Configurations

## Project Details
- **agent** folder includes the Dockerfile for the custom agent image.
- **controller** folder includes the Dockerfile for the custom controller image including the configuration files.
    -   jenkins.yaml - Configuration file for ECS Cloud and environment variables provided during runtime from the CDK Infrastructure stack.
    -   plugins.txt - Provides required plugins along with appropriate versions.
    -   custom.groovy - Init Groovy script for setting the defaults.

## Reference
* https://github.com/jenkinsci/docker
* https://hub.docker.com/_/jenkins 

## Plugin Reference
* https://plugins.jenkins.io/configuration-as-code/
* https://plugins.jenkins.io/amazon-ecs/

## Sample Job Configurations
- **ecs-fargate-validate-configuration** - Job to validate the deployment configuration for controller and agent.
- **ecs-fargate-validate-devops-account-create-s3-bucket** - Job configured to checkout project from GitHub SCM and deploy CloudFormation template to create an S3 bucket in DevOps account using configuration from Jenkinsfile and environment variables.
- **ecs-fargate-validate-workload-account-deploy-ec2-webserver** - Job configured to checkout project from GitHub and deploy CloudFormation template to create an EC2 instance in Workload account using configuration from Jenkinsfile and environment variables. Please note that the template provided is only to demonstrate EC2 deployment through Jenkins. Please follow infrastructure best practices to deploy applications to AWS.

## Useful commands
* Assume Role: `aws sts assume-role --role-arn arn:aws:iam::111111111111:role/jenkins-deployment-role --role-session-name jenkins-deployment-role`
* ECS Execute Command: `aws ecs execute-command --cluster <provide-cluster-name> --task <controllertaskid> --interactive --command "/bin/sh"`

## Known Issues
* Amazon ECS v1.46 issues with launching agent container: https://github.com/jenkinsci/amazon-ecs-plugin/issues
* Vulnerabilities identitifed on ECR Scan on Jenkins controller and agent images.