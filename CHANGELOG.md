# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2023-04-07

### Added

- Initial Release

## Features
- Jenkins Configuration as Code with required plugins.
- Jenkins Configuration with Amazon ECS plugin.
- Jenkins custom controller and agent container builds with private root CA import.
- Jenkins global environment variables and sample job configurations as code.
- Jenkins sample cross account (workload) deployment from DevOps account.
- Jenkins persistent file system leveraging EFS.
- Jenkins sample job configurations as code and sample CloudFormation templates demonstrating integration with Github.
- Jenkins Private Certificate Authority setup with self-signed (default mode) certificate and optional AWS Private CA mode. 
- Jenkins deployment to private hosted zone with restricted access from Bastion host.
- Leveraging values from Secrets Manager and Parameter Store in CDK.
- CDK Pipeline using parallel stages and post hooks.
- CDK Code Build authentication with Docker Registry using Secrets Manager.
- Docker cached build and image tag versioning using parameter store.
- ECR Repo Creation, Lifecycle rules and Container Scanning.
- Dynamic variables using CDK context.json.
- CDK Unit tests for the CDK project.