## Security Disclaimer
Instructions provided below are in the context of sample code for testing. You are responsible for testing, securing, and optimizing the sample code, as appropriate for production grade use based on your specific quality control practices and standards and security practices. 

## Private CA Setup

Ensure you have access completed the Cloud9 setup prior to working through the below steps. In order to apply SSL certificate to the Internal ALB that is accessible only in the VPC through a private Amazon Route 53 hosted zone we have two options, the first one is importing certificate from your PKI infrastructure to Amazon Certificate Manager or leverage AWS Private CA is used to issue SSL certificate. It is recommended to use AWS Private CA but please review the pricing details before you leverage this option. For the deployment we will be using a self signed certificate. Please review the necessary setup and configuration to use eiher of the options. Default mode for certificate is **self-signed** and this is configured in cdk.json. The two options are **self-signed** and **acm-pca**.

## Option 1: Self Signed Certificate using OpenSSL - Default mode for sample deployment.

### Self Signed Certificate setup steps
1. Create a new folder for self signed certificate files.
    ```bash
    cd ~/environment && mkdir openssl-setup && cd openssl-setup
    ```

2. Create Certificate Authority (CA)
    ```bash
    openssl req -x509 \
        -sha256 -days 365 \
        -nodes \
        -newkey rsa:2048 \
        -subj "/CN=internal.anycompany.com/C=US/ST=WA/L=Seattle/O=AnyCompany/OU=IT-Applications" \
        -keyout rootCA.key -out rootCA.crt 
    ```

3. Generate Private Key using openssl.
    ```bash
    openssl genrsa 2048 > jenkins-dev.private.key
    ```

4. Create a Certificate Signing Request
    - Create a file called csr.conf with the configuration values.
        ```bash
        cat > csr.conf <<EOF
        [req]
        distinguished_name = req_distinguished_name
        req_extensions = v3_req
        prompt = no

        [req_distinguished_name]
        C=US
        ST=WA
        L=Seattle
        O=AnyCompany
        OU=IT DevOps Applications
        CN=jenkins-dev.internal.anycompany.com

        [v3_req]
        keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
        extendedKeyUsage = serverAuth
        subjectAltName = @alt_names

        [alt_names]
        DNS.1 = jenkins-dev.internal.anycompany.com

        EOF
        ```

    - Generate Certificate Signing Request (CSR) using Private Key.
    ```bash
    openssl req -new -key jenkins-dev.private.key -out jenkins-dev.private.csr -config csr.conf
    ```

5. Generate SSL Certificate with self signed CA

    ```bash
    openssl x509 -req \
        -in jenkins-dev.private.csr \
        -CA rootCA.crt -CAkey rootCA.key \
        -CAcreateserial -out jenkins-dev.private.crt \
        -days 365 \
        -sha256 -extfile csr.conf -extensions v3_req
    ```

6. Validate the certificate 
    ```bash
    openssl x509 -noout -text -in jenkins-dev.private.crt
    ```

6. Import the certifcate into AWS Certificate Manager so that it could be used by the ALB.
    ```bash
    aws acm import-certificate --certificate file://jenkins-dev.private.crt --private-key file://jenkins-dev.private.key --region $CDK_DEFAULT_REGION
    ```

7. Store the root CA certificate in secrets manager that can be used by CDK pipeline when building container image.
    - Let us encode the pem with base64 to preserve the format of the pem file.
        ```bash
        cd ~/environment/openssl-setup
        echo $(base64 -w 0 rootCA.crt) >> encoded_pem.txt  
        ```
    - Create a secret to store the root CA.
        ```bash
        aws secretsmanager create-secret \
            --name /dev/jenkins/rootCA \
            --description "Jenkins Private Root CA" \
            --secret-string file://encoded_pem.txt \
            --region=$CDK_DEFAULT_REGION
        ```
    - Validate that the contents were stored correctly by running the below command to retrive the value and decode it.
        ```bash
        aws secretsmanager get-secret-value --secret-id /dev/jenkins/rootCA --region $CDK_DEFAULT_REGION --query 'SecretString' --output text | base64 -d
        ```

8. Store the ACM Certificate ARN in parameter store that will be used for the Jenkins ALB. 
    ```bash
    aws ssm put-parameter \
    --name "/dev/jenkins/acm/selfSignedCertificateArn" \
    --value "<PROVIDE-CERTIFICATE-ARN-FROM-STEP-6>" \
    --type String \
    --region=$CDK_DEFAULT_REGION
    ```

9. cdk.json default value for **ctxACMCertMode** is **self-signed**.

### AWS Certificate Manager
- [Importing certificates into AWS Certificate Manager](https://docs.aws.amazon.com/acm/latest/userguide/import-certificate.html)

## Option 2: AWS Private CA - Recommended for development and production.

**Note** Please review the pricing for AWS Private CA. AWS Private CA offers 30-day free trial. If you do want to avoid the charges please make sure that you review the details on AWS Private CA Pricing [here](https://aws.amazon.com/private-ca/pricing/).
    
### AWS Private CA setup steps

**Note:** Below instructions provide steps to complete the setup using AWS CLI. You can also use AWS Console if that is more comfortable for you. For more details on AWS Private CA setup and documentation please refer to the [reference section](#aws-private-ca-reference).
 
1. Create a new folder for private CA and create CA config.
    - Create a new directory.

        ```bash
        cd ~/environment && mkdir privateca-setup && cd privateca-setup
        ```
    - Create ca_config.txt. Please update the values for subject as necessary.
        ```bash
        cat > ca_config.txt <<EOF
        {
            "KeyAlgorithm":"RSA_2048",
            "SigningAlgorithm":"SHA256WITHRSA",
            "Subject":{
                "Country":"US",
                "Organization":"AnyCompany",
                "OrganizationalUnit":"IT Applications",
                "State":"WA",
                "Locality":"Seattle",
                "CommonName":"internal.anycompany.com"
            }
        }
        EOF
        ```

2. Creating a Private CA.
    ```bash
    cd ~/environment/private-ca
    aws acm-pca create-certificate-authority \
        --certificate-authority-configuration file://ca_config.txt \
        --certificate-authority-type "ROOT" \
        --idempotency-token 0123456789 \
        --region $CDK_DEFAULT_REGION \
        --tags Key=Name,Value=JenkinsDevPrivateCA
    ```

3. Installing a root CA certificate.
    - Generate a certificate signing request (CSR). Provide the Certificate ARN from above step 2.
        ```bash
        cd ~/environment/private-ca
        aws acm-pca get-certificate-authority-csr \
            --certificate-authority-arn arn:aws:acm-pca:region:account:certificate-authority/CA_ID \
            --output text \
            --endpoint https://acm-pca.${CDK_DEFAULT_REGION}.amazonaws.com/ \
            --region $CDK_DEFAULT_REGION > ca.csr
        ```
    - Using the CSR from the previous step as the argument for the --csr parameter, issue the root certificate. Provide the Certificate ARN from above step 2.
        ```bash
        aws acm-pca issue-certificate \
            --certificate-authority-arn arn:aws:acm-pca:region:account:certificate-authority/CA_ID \
            --csr file://ca.csr \
            --signing-algorithm SHA256WITHRSA \
            --template-arn arn:aws:acm-pca:::template/RootCACertificate/V1 \
            --validity Value=730,Type=DAYS \
            --region $CDK_DEFAULT_REGION
        ```
    - Retrieve the root certificate. Provide the Certificate ARN from above step 2 and certificate arn from above issue certificate step.
        ```bash
        aws acm-pca get-certificate \
            --certificate-authority-arn arn:aws:acm-pca:region:account:certificate-authority/CA_ID \
            --certificate-arn arn:aws:acm-pca:region:account:certificate-authority/CA_ID/certificate/certificate_ID \
            --region $CDK_DEFAULT_REGION \
            --output text > cert.pem
        ```
    - Import the root CA certificate to install it on the CA. Provide the Certificate ARN from above step 2.
        ```bash
        aws acm-pca import-certificate-authority-certificate \
            --certificate-authority-arn arn:aws:acm-pca:region:account:certificate-authority/CA_ID \
            --region $CDK_DEFAULT_REGION \
            --certificate file://cert.pem
        ```

4. Store the root CA certificate in secrets manager that can be used by CDK pipeline when building container image.
    - Let us encode the pem with base64 to preserve the format of the pem file.
        ```bash
        cd ~/environment/privateca-setup
        echo $(base64 -w 0 cert.pem) >> encoded_pem.txt  
        ```
    - Create a secret to store the root CA.
        ```bash
        aws secretsmanager create-secret \
            --name /dev/jenkins/rootCA \
            --description "Jenkins Private Root CA" \
            --secret-string file://encoded_pem.txt \
            --region=$CDK_DEFAULT_REGION
        ```
    - Validate that the contents were stored correctly by running the below command to retrive the value and decode it.
        ```bash
        aws secretsmanager get-secret-value --secret-id /dev/jenkins/rootCA --region $CDK_DEFAULT_REGION --query 'SecretString' --output text | base64 -d
        ```

5. Store the Private Certificate Authority ARN in parameter store that will be used to issue certificate for the Jenkins ALB through Amazon Certificate Manager. 
    ```bash
    aws ssm put-parameter \
    --name "/dev/jenkins/acmpca/certificateAuthorityArn" \
    --value "<PROVIDE-CERTIFICATE-ARN-FROM-STEP-2>" \
    --type String \
    --region=$CDK_DEFAULT_REGION
    ```
6. Update cdk.json value for **ctxACMCertMode** as **acm-pca**.

### AWS Private CA Reference
- [What is AWS Private CA?](https://docs.aws.amazon.com/privateca/latest/userguide/PcaWelcome.html)
- [Creating a private CA](https://docs.aws.amazon.com/privateca/latest/userguide/create-CA.html)

