import { Construct } from "constructs";
import { CdkUtil} from "./cdk-util";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as efs from "aws-cdk-lib/aws-efs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as acmpca from 'aws-cdk-lib/aws-acmpca';
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import { SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";

export enum CERT_MODE {
  SELFSIGNED = "self-signed",
  ACMPCA = "acm-pca"
}

export class CdkInfraStack extends cdk.Stack {
  private jnlpPort: number;
  private hostedZoneName: string;
  private jenkinsDomainNamePrefix: string;
  private jenkinsBaseUrl: string;
  private jenkinsControllerName: string;
  private jenkinsControllerImageTagParameterName: string;
  private jenkinsAgentName: string;
  private jenkinsAgentImageTagParameterName: string;
  private jenkinsAdminCredentialSecretName: string;
  private jenkinsNakedDomainName: string;
  private devTeam1Workload1AWSAccountIdParameterName: string;
  private acmPCACertificateArnParameterName: string;
  private acmSelfSignedCertificateArnParameterName: string;
  private acmCertMode: string;
  private certificate: cdk.aws_certificatemanager.ICertificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /************************************************************************/
    /* Get CDK Context Values
    /************************************************************************/
    const util = new CdkUtil(this);
    this.jnlpPort = util.getCdkContextValue("ctxJnlpPort");
    this.hostedZoneName = util.getCdkContextValue("ctxHostedZoneName");
    this.jenkinsDomainNamePrefix = util.getCdkContextValue("ctxJenkinsDomainNamePrefix");
    this.jenkinsControllerName = util.getCdkContextValue("ctxJenkinsControllerName");
    this.jenkinsControllerImageTagParameterName = util.getCdkContextValue("ctxJenkinsControllerImageTagParameterName");
    this.jenkinsAgentName = util.getCdkContextValue("ctxJenkinsAgentName");
    this.jenkinsAgentImageTagParameterName = util.getCdkContextValue("ctxJenkinsAgentImageTagParameterName");
    this.jenkinsAdminCredentialSecretName = util.getCdkContextValue("ctxJenkinsAdminCredentialSecretName");
    this.devTeam1Workload1AWSAccountIdParameterName = util.getCdkContextValue("ctxDevTeam1Workload1AWSAccountIdParameterName");
    this.acmPCACertificateArnParameterName = util.getCdkContextValue("ctxACMPCACertificateArnParameterName")
    this.acmSelfSignedCertificateArnParameterName = util.getCdkContextValue("ctxACMSelfSignedCertificateArnParameterName")
    this.jenkinsBaseUrl = "https://" + this.jenkinsDomainNamePrefix + "." + this.hostedZoneName;
    this.jenkinsNakedDomainName = this.jenkinsDomainNamePrefix + "." + this.hostedZoneName;
    this.acmCertMode = util.getCdkContextValue("ctxACMCertMode");

    /************************************************************************/
    /* Lookup ECR Repo, Secrets and Parameter defaults
    /************************************************************************/
    const jenkinsControllerRepo = ecr.Repository.fromRepositoryName(this, 'jenkins-controller-repo', this.jenkinsControllerName)
    const jenkinsAgentLeaderRepo = ecr.Repository.fromRepositoryName(this, 'jenkins-agent-repo', this.jenkinsAgentName)

    const jenkinsCredentials = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${this.stackName}-admin-user-credentials`,
      this.jenkinsAdminCredentialSecretName,
    );

    const jenkinsControllerTag = ssm.StringParameter.valueForStringParameter(
      this,
      this.jenkinsControllerImageTagParameterName,
    );

    const jenkinsAgentTag = ssm.StringParameter.valueForStringParameter(
      this,
      this.jenkinsAgentImageTagParameterName,
    );

    const devTeam1Workload1TargetAccount = ssm.StringParameter.valueForStringParameter(
      this,
      this.devTeam1Workload1AWSAccountIdParameterName,
    );


    
    /************************************************************************/
    /* VPC, Subnets, Networking
    /************************************************************************/
    const vpc = new ec2.Vpc(this, `${this.stackName}-vpc`, {
      vpcName: this.stackName,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/20'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: false
        },
        {
          cidrMask: 24,
          name: "private-alb",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "private-app",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    /************************************************************************/
    /* Create private hosted zone and issue a private certificate for jenkins 
    /************************************************************************/
    const hostedZone = new route53.PrivateHostedZone(this, `${this.stackName}-hosted-zone`, {
      zoneName: this.hostedZoneName,
      vpc: vpc
    });
    
    /************************************************************************/
    /* Lookup self signed cert or issue a certificate using ACM PCA 
    /************************************************************************/
    if (this.acmCertMode == CERT_MODE.SELFSIGNED){
      const acmSelfSignedCertificateArn = ssm.StringParameter.valueForStringParameter(
        this,
        this.acmSelfSignedCertificateArnParameterName,
      );
      this.certificate = acm.Certificate.fromCertificateArn(this, `${this.stackName}-acm-certificate`, acmSelfSignedCertificateArn);
    } else if (this.acmCertMode == CERT_MODE.ACMPCA) {
      const acmPCACertificateArn = ssm.StringParameter.valueForStringParameter(
        this,
        this.acmPCACertificateArnParameterName,
      );
      this.certificate = new acm.PrivateCertificate(this, `${this.stackName}-acm-pca-certificate`, {
        domainName: this.jenkinsNakedDomainName,
        certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(this, 'acm-pca-certificate', acmPCACertificateArn)
      });
    }

    /***************************************************************************/
    /* Jenkins ECS cluster
    /***************************************************************************/
    const ecsCluster = new ecs.Cluster(
      this,
      `${this.stackName}-ecs-cluster`,
      {
        vpc: vpc,
        clusterName: `${this.stackName}-ecs-cluster`,
        defaultCloudMapNamespace: {
          name: `${this.stackName}-private`,
          type: servicediscovery.NamespaceType.DNS_PRIVATE,
          vpc: vpc
        },
        containerInsights: true
      }
    );

    /***************************************************************************/
    /* Jenkins ECS Cluster Security Group
    /***************************************************************************/
    const ecsClusterSG = new ec2.SecurityGroup(
      this,
      `${this.stackName}-controller-sg`,
      {
        securityGroupName: `${this.stackName}-controller-sg`,
        vpc: vpc,
        allowAllOutbound: true,
        description: "Jenkins Controller Service Security Group",
      }
    );

    const efsSG = new ec2.SecurityGroup(
      this,
      `${this.stackName}-efs-sg`,
      {
        securityGroupName: `${this.stackName}-efs-sg`,
        vpc: vpc,
        allowAllOutbound: false,
        description: "Jenkins EFS Security Group",
      }
    );

    efsSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [ecsClusterSG],
      }),
      ec2.Port.tcp(2049),
      'allow traffic on port 2049 from Jenkins Controller to EFS',
    );

    efsSG.connections.allowTo(
      new ec2.Connections({
        securityGroups: [ecsClusterSG],
      }),
      ec2.Port.tcp(2049),
      'allow traffic to port 2049 from EFS to Jenkins Controller',
    );

    /***************************************************************************/
    /* Jenkins EFS File System and Access Point
    /***************************************************************************/
    const fileSystem = new efs.FileSystem(this, `${this.stackName}-efs`, {
      fileSystemName: `${this.stackName}-efs`,
      vpc: vpc,
      vpcSubnets: {
        subnetGroupName: "private-app"
      },
      encrypted: true,
      securityGroup: efsSG,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enableAutomaticBackups: true
    });
    
    const accessPoint = new efs.AccessPoint(this, `${this.stackName}-efs-ap`, {
      fileSystem: fileSystem,
      posixUser: {
        uid: "1000",
        gid: "1000"
      },
      createAcl: {
        ownerUid: "1000",
        ownerGid: "1000",
        permissions: "755"
      },
      path: '/jenkins'
    });

    /***************************************************************************/
    /* Jenkins Controller and Agent execution and task role
    /***************************************************************************/
    const jenkinsAgentExecutionRole = new iam.Role(
      this,
      `${this.stackName}-agent-execution-role`,
      {
        roleName: `${this.stackName}-agent-execution-role`,
        assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonECSTaskExecutionRolePolicy"
          )
        ]
      }
    );

    const jenkinsAgentTaskRole = new iam.Role(
      this,
      `${this.stackName}-agent-task-role`,
      {
        roleName: `${this.stackName}-agent-task-role`,
        assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        inlinePolicies: {
          "create-loggroup": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "logs:CreateLogGroup",
                  "logs:PutLogEvents",
                  "logs:TagResource"
                ],
                resources: [
                  `arn:aws:logs:${this.region}:${this.account}:log-group/*`
                ],
              }),
            ]
          })
        }
      }
    );

    const jenkinsControllerExecutionRole = new iam.Role(
      this,
      `${this.stackName}-controller-execution-role`,
      {
        roleName: `${this.stackName}-controller-execution-role`,
        assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonECSTaskExecutionRolePolicy"
          )
        ]
      }
    );

    const jenkinsControllerTaskRole = new iam.Role(
      this,
      `${this.stackName}-controller-task-role`,
      {
        roleName: `${this.stackName}-controller-task-role`,
        assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonECSTaskExecutionRolePolicy"
          )
        ],
        inlinePolicies: {
          "secrets-role": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "secretsmanager:GetSecretValue"
                ],
                resources: [
                  `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:jenkins_secret`
                ],
              }),
            ]
          }),
          "ecr-role": new iam.PolicyDocument({
            statements: [
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
                ],
                resources: [
                  `arn:aws:ecr:${this.region}:${this.account}:repository/jenkins*`
                ],
              }),
            ],
          }),
          "create-loggroup": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "logs:CreateLogGroup",
                  "logs:PutLogEvents",
                  "logs:TagResource"
                ],
                resources: [
                  `arn:aws:logs:${this.region}:${this.account}:log-group/*`
                ],
              }),
            ]
          }),
          "efs-access": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "elasticfilesystem:ClientRootAccess",
                  "elasticfilesystem:ClientMount",
                  "elasticfilesystem:ClientWrite",
                  "elasticfilesystem:DescribeMountTargets"
                ],
                resources: [
                  `arn:aws:elasticfilesystem:${this.region}:${this.account}:file-system/${fileSystem.fileSystemId}`
                ],
              }),
            ]
          }),
          "ssm-access": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "ssmmessages:CreateControlChannel",
                  "ssmmessages:CreateDataChannel",
                  "ssmmessages:OpenControlChannel",
                  "ssmmessages:OpenDataChannel"
                ],
                resources: ["*"],
              }),
            ]
          }),
          "launch-agent": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "ecs:RegisterTaskDefinition",
                  "ecs:ListClusters",
                  "ecs:DescribeContainerInstances",
                  "ecs:ListTaskDefinitions",
                  "ecs:DescribeTaskDefinition",
                  "ecs:DeregisterTaskDefinition",
                ],
                resources: ["*"],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "ecs:ListContainerInstances",
                  "ecs:DescribeClusters"
                ],
                resources: [
                  `arn:aws:ecs:${this.region}:${this.account}:cluster/${ecsCluster.clusterName}`
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "ecs:RunTask"
                ],
                conditions: {
                  ArnEquals: {
                    "ecs:cluster":`arn:aws:ecs:${this.region}:${this.account}:cluster/${ecsCluster.clusterName}`
                  },
                },
                resources: [
                  `arn:aws:ecs:${this.region}:${this.account}:task-definition/*`
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "ecs:DescribeTasks",
                  "ecs:StopTask",
                ],
                conditions: {
                  ArnEquals: {
                    "ecs:cluster":`arn:aws:ecs:${this.region}:${this.account}:cluster/${ecsCluster.clusterName}`
                  },
                },
                resources: [
                  `arn:aws:ecs:${this.region}:${this.account}:task/*`
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "iam:PassRole"
                ],
                resources: [
                  jenkinsAgentTaskRole.roleArn,
                  jenkinsAgentExecutionRole.roleArn
                ],
              }),
            ],
          }),
          "assume-role": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "sts:AssumeRole"
                ],
                resources: [
                  `arn:${this.partition}:iam::${this.account}:role/jenkins-deployment-role`,
                  `arn:${this.partition}:iam::${devTeam1Workload1TargetAccount}:role/jenkins-deployment-role`
                ],
              }),
            ]
          })
        },
      }
    );

    /***************************************************************************/
    /* Create Log Groups for Controller and Agent
    /***************************************************************************/
    const controllerLogGroup = new logs.LogGroup(this, `${this.stackName}-controller-loggroup`, {
      logGroupName: `/aws/ecs/${ecsCluster.clusterName}/service/jenkins-controller`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const controllerLogging = ecs.LogDrivers.awsLogs({
      streamPrefix: this.jenkinsControllerName,
      logGroup: controllerLogGroup
    });

    const agentLogGroup = new logs.LogGroup(this, `${this.stackName}-agent-loggroup`, {
      logGroupName: `/aws/ecs/${ecsCluster.clusterName}/service/jenkins-agent`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const agentLogging = ecs.LogDrivers.awsLogs({
      streamPrefix: this.jenkinsAgentName,
      logGroup: agentLogGroup
    });

    /***************************************************************************/
    /* Jenkins Agent Security Group Intercommunication
    /***************************************************************************/
    const ecsJenkinsAgentSG = new ec2.SecurityGroup(
      this,
      `${this.stackName}-agent-sg`,
      {
        securityGroupName: `${this.stackName}-agent-sg`,
        vpc: vpc,
        allowAllOutbound: false,
        description: "Jenkins Agent Security Group",
      }
    );

    ecsClusterSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [ecsJenkinsAgentSG],
      }),
      ec2.Port.tcp(this.jnlpPort),
      'allow traffic on port 50000 from the Jenkins Agent',
    );

    ecsJenkinsAgentSG.addEgressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(443),
      'allow outbound traffic on port 443 from Jenkins Agent',
    );

    /***************************************************************************/
    /* Jenkins ECS Loadbalancer
    /***************************************************************************/
    const jenkinsALB = new elb.ApplicationLoadBalancer(this, `${this.stackName}-controller-lb`, {
      vpc,
      internetFacing: false,
      loadBalancerName: this.stackName,
      vpcSubnets: {
          onePerAz: true,
          subnetGroupName: "private-alb"
      }
    })

    /***************************************************************************/
    /* Jenkins ECS Loadbalancer, Service and Task Definition
    /***************************************************************************/
    const loadBalancedFargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        `${this.stackName}-lb-fargate-service`,
        {
          loadBalancer: jenkinsALB,
          cluster: ecsCluster,
          securityGroups: [ecsClusterSG],
          taskSubnets: {
            subnetGroupName: "private-app"
          },
          serviceName: "jenkins-controller-service",
          cpu: 2048,
          memoryLimitMiB: 4096,
          desiredCount: 1,
          assignPublicIp: true,
          healthCheckGracePeriod: cdk.Duration.seconds(300),
          taskImageOptions: {
            family: this.jenkinsControllerName,
            image: ecs.ContainerImage.fromEcrRepository(jenkinsControllerRepo, jenkinsControllerTag),
            containerName: this.jenkinsControllerName,
            containerPort: 8080,
            taskRole: jenkinsControllerTaskRole,
            executionRole: jenkinsControllerExecutionRole,
            enableLogging: true,
            logDriver: controllerLogging,
            environment: {
              ECS_CLUSTER: ecsCluster.clusterArn,
              AWS_REGION: this.region,
              JENKINS_URL: this.jenkinsBaseUrl,
              JENKINS_CONTROLLER_PRIVATE_TUNNEL_URL: `controller.${ecsCluster.defaultCloudMapNamespace?.namespaceName}:${this.jnlpPort}`,
              PRIVATE_SUBNET_IDS: vpc.privateSubnets.map((item) => {return item.subnetId}).join(","),
              AGENT_ECR_IMAGE_URL: `${jenkinsAgentLeaderRepo.repositoryUri}:${jenkinsAgentTag}`,
              AGENT_SECURITY_GROUP_ID: ecsJenkinsAgentSG.securityGroupId,
              AGENT_TASK_ROLE_ARN: jenkinsAgentTaskRole.roleArn,
              AGENT_EXECUTION_ROLE_ARN: jenkinsAgentExecutionRole.roleArn,
              LOG_GROUP: agentLogGroup.logGroupName,
              LOG_STREAM_PREFIX: this.jenkinsAgentName,
              DEFAULT_ACCOUNT: this.account,
              DEFAULT_ACCOUNT_JENKINS_ROLE: `arn:${this.partition}:iam::${this.account}:role/jenkins-deployment-role`,
              TEAM1_APP1_DEV_WORKLOAD_ACCOUNT: devTeam1Workload1TargetAccount,
              TEAM1_APP1_DEV_WORKLOAD_JENKINS_ROLE: `arn:${this.partition}:iam::${devTeam1Workload1TargetAccount}:role/jenkins-deployment-role`
            },
            secrets: {
              JENKINS_USERNAME: ecs.Secret.fromSecretsManager(jenkinsCredentials, "username"),
              JENKINS_PASSWORD: ecs.Secret.fromSecretsManager(jenkinsCredentials, "password")
            }
          },
          enableExecuteCommand: true,
          protocol: elb.ApplicationProtocol.HTTPS,
          certificate: this.certificate,
          sslPolicy: SslPolicy.TLS12_EXT,
          redirectHTTP: true
        }
    );

    /***************************************************************************/
    /* Jenkins create A record for the domain
    /***************************************************************************/
    new route53.ARecord(this, `${this.stackName}-A-record`, {
      zone: hostedZone,
      recordName: this.jenkinsNakedDomainName,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(loadBalancedFargateService.loadBalancer)),
    });

    /***************************************************************************/
    /* Jenkins Controller Task Definition EFS Mount and Volume
    /***************************************************************************/
    loadBalancedFargateService.taskDefinition.addVolume({
      name: "jenkins-volume",
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig:{
          accessPointId: accessPoint.accessPointId,
          iam: 'ENABLED'
        }
      }
    })

    loadBalancedFargateService.taskDefinition.defaultContainer?.addMountPoints({
      containerPath: '/var/jenkins_home',
      sourceVolume: "jenkins-volume",
      readOnly: false
    })

    /***************************************************************************/
    /* Jenkins task port mappings and Cloudmap configuration
    /***************************************************************************/
    loadBalancedFargateService.taskDefinition.defaultContainer?.addPortMappings({
        containerPort: this.jnlpPort,
        hostPort: this.jnlpPort
    });

    loadBalancedFargateService.service.enableCloudMap({
        name: 'controller',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        container:  loadBalancedFargateService.taskDefinition.defaultContainer,
        containerPort: this.jnlpPort
    })

    /***************************************************************************/
    /* Jenkins LB healthcheck
    /***************************************************************************/
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/login",
      port: "8080",
    });
    
  }
}
