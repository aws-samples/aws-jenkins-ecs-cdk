ARG PRIVATE_ROOT_CA
FROM jenkins/inbound-agent:latest-jdk11

USER root
RUN apt-get update && apt-get install curl unzip jq -y
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
ARG PRIVATE_ROOT_CA
RUN echo $PRIVATE_ROOT_CA | base64 --decode >> /tmp/private-root-ca.pem
RUN keytool -importcert -noprompt -trustcacerts -alias jenkins-cert -file /tmp/private-root-ca.pem -cacerts -storepass changeit
RUN rm -rf awscliv2.zip && rm -rf /tmp/* /var/tmp/*

USER jenkins