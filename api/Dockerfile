# Build Stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y maven
RUN mvn clean package -Dmaven.test.skip=true


# Runtime Stage
FROM amazoncorretto:17-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the compiled Spring Boot application JAR file into the container at /app
COPY --from=build /app/target/*.jar my-spring-boot-app.jar

# Expose the port that the Spring Boot application will run on
EXPOSE 8080

# Specify the command to run on container startup
CMD ["java", "-jar", "/app/my-spring-boot-app.jar"]
