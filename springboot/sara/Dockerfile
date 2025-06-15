# Multi-stage build with ARM optimization
# Stage 1: Build with Maven
FROM --platform=linux/arm64 maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Improved dependency caching (combine old and new approaches)
COPY pom.xml .
RUN mvn -B dependency:go-offline dependency:resolve-plugins

# Copy source code and build (preserve old packaging command)
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Optimized runtime environment
FROM --platform=linux/arm64 eclipse-temurin:21-jre-jammy

# Create app directory first
WORKDIR /app

# Install required packages and configure user
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    passwd && \
    groupadd -r myuser && \
    useradd -r -g myuser -m -s /sbin/nologin myuser && \
    chown -R myuser:myuser /app && \
    chmod -R 0750 /app && \
    rm -rf /var/lib/apt/lists/*

# Copy application
COPY --from=builder /app/target/*.jar app.jar


# ARM-optimized JVM settings with security flags
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75 \
               -XX:+UseG1GC \
               -XX:MaxGCPauseMillis=200 \
               -Djava.security.egd=file:/dev/./urandom \
               -Dfile.encoding=UTF-8"

USER myuser

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]