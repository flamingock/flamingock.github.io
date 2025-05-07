---
sidebar_position: 10
---

# GraalVM

Welcome to the guide to integrate Flamingock and **[GraalVM](https://www.graalvm.org)** native image. 

## Prerequisites

Before proceeding, ensure the following tools are installed and properly configured:

- GraalVM: Download and configure GraalVM as your active Java runtime.
- Native Image Tool: Install the **[native-image](https://www.graalvm.org/latest/reference-manual/native-image/)** component provided by GraalVM.
- Maven or Gradle: Both build tools are supported—use the one that best fits your project requirements.
- Docker: Required if you intend to build native images using a Docker-based approach.

## Setup 

### Maven 

1. Add GraalVM dependency
```xml
<dependencies>
    <dependency>
        <groupId>io.flamingock</groupId>
        <artifactId>mongodb-sync-v4-driver</artifactId>
        <version>${flamingock.version}</version>
    </dependency>

    <dependency>
        <groupId>io.flamingock</groupId>
        <artifactId>flamingock-core</artifactId>
        <version>${flamingock.version}</version>
    </dependency>

    <dependency>
        <groupId>io.flamingock</groupId>
        <artifactId>flamingock-graalvm</artifactId>
        <version>${flamingock.version}</version>
    </dependency>
</dependencies>

```

2. Add annotation processor
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>io.flamingock</groupId>
                        <artifactId>flamingock-core</artifactId>
                        <version>${flamingock.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

3. Add the Flamingock configuration file to `resource-config.json`
```json
{
  "resources": {
    "includes": [
      {
        "pattern": "META-INF/flamingock-metadata.json"
      }
    ]
  }
}
```

4. Build application
```shell
./mvnw clean package
```

5. Create native image
```shell
native-image --no-fallback --features=io.flamingock.graalvm.RegistrationFeature -H:ResourceConfigurationFiles=resource-config.json -H:+ReportExceptionStackTraces --initialize-at-build-time=org.slf4j.simple.SimpleLogger,org.slf4j.LoggerFactory,org.slf4j.impl.StaticLoggerBinder -jar target/flamingock-graalvm-example-0.0.1-SNAPSHOT.jar
```
6. Run native image
```shell
./flamingock-graalvm-example-1.0-SNAPSHOT
```

### Gradle

1. Add Flamingock dependencies 
```kotlin
implementation("io.flamingock:mongodb-sync-v4-driver:$flamingockVersion")
implementation("io.flamingock:flamingock-core:$flamingockVersion")
implementation("io.flamingock:flamingock-graalvm:$flamingockVersion")
```

2. Add Flamingock annotation processor
```kotlin
annotationProcessor("io.flamingock:flamingock-core:$flamingockVersion")
```

3. Add plugin manager to `settings.gradle.kts`
```kotlin
pluginManagement {
    repositories {
        mavenLocal()
        gradlePluginPortal()
        mavenCentral()
    }
}
```

4. Add the Flamingock configuration file to `resource-config.json`
```json
{
  "resources": {
    "includes": [
      {
        "pattern": "META-INF/flamingock-metadata.json"
      }
    ]
  }
}
```

5. Build application
```shell
./gradlew clean build
```

6.Create native image
```shell
native-image --no-fallback --features=io.flamingock.graalvm.RegistrationFeature -H:ResourceConfigurationFiles=resource-config.json -H:+ReportExceptionStackTraces --initialize-at-build-time=org.slf4j.simple.SimpleLogger,org.slf4j.LoggerFactory,org.slf4j.impl.StaticLoggerBinder -jar build/libs/flamingock-graalvm-example-0.0.1-SNAPSHOT.jar
```

7. Run native image
```shell
./flamingock-graalvm-example-1.0-SNAPSHOT
```
