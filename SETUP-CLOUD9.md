### AWS account

Ensure you have access to an AWS account, and a set of credentials with *Administrator* permissions. **Note:** In a production environment we would recommend locking permissions down to the bare minimum needed to operate the pipeline.

### Create an AWS Cloud9 environment

Log into the AWS Management Console and search for Cloud9 services in the search bar. Click Cloud9 and create an AWS Cloud9 environment in the a region e.g. `us-east-2` based on Amazon Linux 2. You can provide a environment name of `workshop-environment` for name and select the instance type as **t2.micro** or **t3.micro**.
![Cloud9 Create](assets/images/1-c9-create.png)

### Configure the AWS Cloud9 environment

Launch the AWS Cloud9 IDE. Close the `Welcome` tab and open a new `Terminal` tab.

![Cloud9 Launch](assets/images/2-c9-launch.png)

#### Create and attach an IAM role for your Cloud9 instance

Disable Cloud9 temporary credentials, and create and attach an IAM role for your Cloud9 instance so that you can deploy using AWS CDK for initial setup.

1. Follow [this deep link to find your Cloud9 EC2 instance](https://console.aws.amazon.com/ec2/v2/home?#Instances:tag:Name=aws-cloud9-;sort=desc:launchTime)
2. Download the CloudFormation template. We will use the template to create the IAM role for the Cloud9 instance.
    ```bash
    cd ~/environment && mkdir cloud9-setup && cd cloud9-setup
    curl -OL https://raw.githubusercontent.com/aws-samples/aws-jenkins-ecs-cdk/main/assets/templates/cfn-cloud9-instance.yaml   
    ```
3. Deploy the CloudFormation template using the below steps and wait for completion:
    ```bash
    aws cloudformation deploy --template-file cfn-cloud9-instance.yaml --stack-name cloud9-instance-role-stack --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM       
    ```
4. Select the instance, then choose **Actions / Security / Modify IAM Role**. Note: If you cannot find this menu option, then look under **Actions / Instance Settings / Modify IAM Role** instead.
![cloud9-modify-role](assets/images/6-c9-modify-role.png)
8. Choose **cloud9-instance-profile** from the **IAM Role** drop down, and select **Save**
![cloud9-attach-role](assets/images/7-c9-attach-role.png)
9. Return to your Cloud9 workspace and click the gear icon (in top right corner), or click to open a new tab and choose "Open Preferences"
10. Select **AWS SETTINGS**
11. Turn off **AWS managed temporary credentials**
12. Close the Preferences tab
![cloud9-disable-temp-credentials](assets/images/8-c9-disable-temp-credentials.png)
13. In the Cloud9 terminal pane, execute the command:
    ```bash
    rm -vf ${HOME}/.aws/credentials
    ```
14. Install JSON parser JQ.
    ```bash
    sudo yum install jq -y
    ```
15. As a final check, use the [GetCallerIdentity](https://docs.aws.amazon.com/cli/latest/reference/sts/get-caller-identity.html) CLI command to validate that the Cloud9 IDE is using the correct IAM role.
    ```bash
    aws sts get-caller-identity --query Arn | grep cloud9-instance-role -q && echo "IAM role valid" || echo "IAM role NOT valid"
    ```