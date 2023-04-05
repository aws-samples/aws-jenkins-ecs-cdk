import jenkins.model.*
import jenkins.install.InstallState
Jenkins.instance.setNumExecutors(0) //Recommended to not run builds on the built-in-node

url = System.env.JENKINS_URL // Setting the Jenkins Base URL
urlConfig = JenkinsLocationConfiguration.get()
urlConfig.setUrl(url)
urlConfig.save()