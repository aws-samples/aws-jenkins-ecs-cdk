ARG PRIVATE_ROOT_CA
FROM jenkins/jenkins:lts-jdk11

USER root
RUN apt-get update && apt-get install -y
COPY --chown=jenkins:jenkins config/jenkins.yaml /usr/share/jenkins/ref/jenkins.yaml
COPY --chown=jenkins:jenkins config/custom.groovy /usr/share/jenkins/ref/init.groovy.d/custom.groovy
COPY --chown=jenkins:jenkins config/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN echo 2.0 > /usr/share/jenkins/ref/jenkins.install.UpgradeWizard.state
ARG PRIVATE_ROOT_CA
RUN echo $PRIVATE_ROOT_CA | base64 --decode >> /tmp/private-root-ca.pem
RUN keytool -importcert -noprompt -trustcacerts -alias jenkins-cert -file /tmp/private-root-ca.pem -cacerts -storepass changeit
RUN rm -rf /tmp/* /var/tmp/*

USER jenkins
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt