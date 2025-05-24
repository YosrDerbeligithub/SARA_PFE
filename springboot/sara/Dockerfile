# Multi-stage build for better efficiency
# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache dependencies first (only re-run if pom.xml changes)
COPY pom.xml .
RUN mvn -B dependency:resolve dependency:resolve-plugins

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime environment
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy built artifact from builder
COPY --from=builder /app/target/*.jar app.jar

# Security best practices
RUN useradd -m myuser && chown -R myuser:myuser /app
USER myuser

# Optimized JVM settings
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75"

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]