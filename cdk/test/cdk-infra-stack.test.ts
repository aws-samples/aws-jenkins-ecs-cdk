import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as CdkInfraStack from "../lib/cdk-infra-stack";

test("CDK Infra Stack Self Signed Cert", () => {
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
    const stack = new CdkInfraStack.CdkInfraStack(app, 'CDKInfraStack');

    // THEN
    const template = Template.fromStack(stack);

    // Assert VPC and Subnets
    template.resourceCountIs("AWS::EC2::VPC", 1);
    template.hasResourceProperties("AWS::EC2::VPC", {
        CidrBlock: "10.0.0.0/20",
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
    });

    template.resourceCountIs("AWS::EC2::Subnet", 6);
    template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: "10.0.0.0/24",
        MapPublicIpOnLaunch: false,
    });

    template.resourceCountIs("AWS::ECS::Service", 1);
    template.hasResourceProperties("AWS::ECS::Service", {
        "DesiredCount": 1,
        "EnableECSManagedTags": false,
        "EnableExecuteCommand": true,
        "HealthCheckGracePeriodSeconds": 300,
        "LaunchType": "FARGATE",
        "ServiceName": "jenkins-controller-service",
        "DeploymentConfiguration": {
            "MaximumPercent": 200,
            "MinimumHealthyPercent": 50
        },
    });

    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
        Cpu: "2048",
        Family: "jenkins-controller",
        Memory: "4096",
        NetworkMode: "awsvpc",
        RequiresCompatibilities: [
            "FARGATE"
        ],
    });

    template.resourceCountIs("AWS::ECS::Cluster", 1);
    template.hasResourceProperties("AWS::ECS::Cluster", {
        "ClusterName": "CDKInfraStack-ecs-cluster",
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ]
    })

    template.resourceCountIs("AWS::ServiceDiscovery::PrivateDnsNamespace", 1);
    template.hasResourceProperties("AWS::ServiceDiscovery::PrivateDnsNamespace", {
        "Name": "CDKInfraStack-private",
    })

    template.resourceCountIs("AWS::Route53::RecordSet", 1);
    template.hasResourceProperties("AWS::Route53::RecordSet", {
        "Name": "jenkins-test.example.com.",
        "Type": "A",
    })


    template.resourceCountIs("AWS::ServiceDiscovery::Service", 1);
    template.hasResourceProperties("AWS::ServiceDiscovery::Service", {
        "Name": "controller",
        "HealthCheckCustomConfig": {
            "FailureThreshold": 1
        },
    })

    template.resourceCountIs("AWS::EFS::FileSystem", 1);
    template.hasResourceProperties("AWS::EFS::FileSystem", {
      "BackupPolicy": {
        "Status": "ENABLED"
      },
      "Encrypted": true,
      "FileSystemTags": [
        {
          "Key": "Name",
          "Value": "CDKInfraStack-efs"
        },
      ],
      "PerformanceMode": "generalPurpose"
    });
    template.resourceCountIs("AWS::EFS::AccessPoint", 1);
    template.hasResourceProperties("AWS::EFS::AccessPoint", {
        "FileSystemId": {
            "Ref": "CDKInfraStackefsD9202CAF"
          },
          "PosixUser": {
            "Gid": "1000",
            "Uid": "1000"
          },
          "RootDirectory": {
            "CreationInfo": {
              "OwnerGid": "1000",
              "OwnerUid": "1000",
              "Permissions": "755"
            },
            "Path": "/jenkins"
          }
    })
    
    template.resourceCountIs("AWS::EC2::SecurityGroup", 4);
    template.resourceCountIs("AWS::Logs::LogGroup", 2);

    template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
        "LoadBalancerAttributes": [
            {
              "Key": "deletion_protection.enabled",
              "Value": "false"
            }
        ],
        "Name": "CDKInfraStack",
        "Scheme": "internal",
    })


    template.resourceCountIs("AWS::ElasticLoadBalancingV2::Listener", 2);
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
        "Port": 443,
        "Protocol": "HTTPS",
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"
    })

    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
      "Port": 80,
      "Protocol": "HTTP",
  })

    template.resourceCountIs("AWS::ElasticLoadBalancingV2::TargetGroup", 1);
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", {
        "HealthCheckPath": "/login",
        "HealthCheckPort": "8080",
        "Port": 80,
        "Protocol": "HTTP",
        "TargetGroupAttributes": [
            {
              "Key": "stickiness.enabled",
              "Value": "false"
            }
          ],
        "TargetType": "ip",
    })
});

test("CDK Infra Stack ACM PCA", () => {
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
      "ctxACMCertMode": "acm-pca"
  }});

  // WHEN
  const stack = new CdkInfraStack.CdkInfraStack(app, 'CDKInfraStack');

  // THEN
  const template = Template.fromStack(stack);

  // Assert VPC and Subnets
  template.resourceCountIs("AWS::EC2::VPC", 1);
  template.hasResourceProperties("AWS::EC2::VPC", {
      CidrBlock: "10.0.0.0/20",
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
  });

  template.resourceCountIs("AWS::EC2::Subnet", 6);
  template.hasResourceProperties("AWS::EC2::Subnet", {
      CidrBlock: "10.0.0.0/24",
      MapPublicIpOnLaunch: false,
  });

  template.resourceCountIs("AWS::ECS::Service", 1);
  template.hasResourceProperties("AWS::ECS::Service", {
      "DesiredCount": 1,
      "EnableECSManagedTags": false,
      "EnableExecuteCommand": true,
      "HealthCheckGracePeriodSeconds": 300,
      "LaunchType": "FARGATE",
      "ServiceName": "jenkins-controller-service",
      "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 50
      },
  });

  template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
  template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      Cpu: "2048",
      Family: "jenkins-controller",
      Memory: "4096",
      NetworkMode: "awsvpc",
      RequiresCompatibilities: [
          "FARGATE"
      ],
  });

  template.resourceCountIs("AWS::ECS::Cluster", 1);
  template.hasResourceProperties("AWS::ECS::Cluster", {
      "ClusterName": "CDKInfraStack-ecs-cluster",
      "ClusterSettings": [
        {
          "Name": "containerInsights",
          "Value": "enabled"
        }
      ]
  })

  template.resourceCountIs("AWS::ServiceDiscovery::PrivateDnsNamespace", 1);
  template.hasResourceProperties("AWS::ServiceDiscovery::PrivateDnsNamespace", {
      "Name": "CDKInfraStack-private",
  })

  template.resourceCountIs("AWS::Route53::RecordSet", 1);
  template.hasResourceProperties("AWS::Route53::RecordSet", {
      "Name": "jenkins-test.example.com.",
      "Type": "A",
  })

  template.resourceCountIs("AWS::ServiceDiscovery::Service", 1);
  template.hasResourceProperties("AWS::ServiceDiscovery::Service", {
      "Name": "controller",
      "HealthCheckCustomConfig": {
          "FailureThreshold": 1
      },
  })

  template.resourceCountIs("AWS::CertificateManager::Certificate", 1);
  template.hasResourceProperties("AWS::CertificateManager::Certificate", {
      "DomainName": "jenkins-test.example.com",
  })

  template.resourceCountIs("AWS::EFS::FileSystem", 1);
  template.hasResourceProperties("AWS::EFS::FileSystem", {
    "BackupPolicy": {
      "Status": "ENABLED"
    },
    "Encrypted": true,
    "FileSystemTags": [
      {
        "Key": "Name",
        "Value": "CDKInfraStack-efs"
      },
    ],
    "PerformanceMode": "generalPurpose"
  });
  template.resourceCountIs("AWS::EFS::AccessPoint", 1);
  template.hasResourceProperties("AWS::EFS::AccessPoint", {
      "FileSystemId": {
          "Ref": "CDKInfraStackefsD9202CAF"
        },
        "PosixUser": {
          "Gid": "1000",
          "Uid": "1000"
        },
        "RootDirectory": {
          "CreationInfo": {
            "OwnerGid": "1000",
            "OwnerUid": "1000",
            "Permissions": "755"
          },
          "Path": "/jenkins"
        }
  })
  
  template.resourceCountIs("AWS::EC2::SecurityGroup", 4);
  template.resourceCountIs("AWS::Logs::LogGroup", 2);

  template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
  template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
      "LoadBalancerAttributes": [
          {
            "Key": "deletion_protection.enabled",
            "Value": "false"
          }
      ],
      "Name": "CDKInfraStack",
      "Scheme": "internal",
  })


  template.resourceCountIs("AWS::ElasticLoadBalancingV2::Listener", 2);
  template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
      "Port": 443,
      "Protocol": "HTTPS",
      "SslPolicy": "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"
  })

  template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
    "Port": 80,
    "Protocol": "HTTP",
})

  template.resourceCountIs("AWS::ElasticLoadBalancingV2::TargetGroup", 1);
  template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", {
      "HealthCheckPath": "/login",
      "HealthCheckPort": "8080",
      "Port": 80,
      "Protocol": "HTTP",
      "TargetGroupAttributes": [
          {
            "Key": "stickiness.enabled",
            "Value": "false"
          }
        ],
      "TargetType": "ip",
  })
});
