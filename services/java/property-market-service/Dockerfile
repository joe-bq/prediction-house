FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY pom.xml ./
COPY src ./src

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://repo1.maven.org/maven2/org/apache/maven/apache-maven/3.9.11/apache-maven-3.9.11-bin.tar.gz -o /tmp/maven.tar.gz \
    && mkdir -p /opt/maven \
    && tar -xzf /tmp/maven.tar.gz -C /opt/maven --strip-components=1 \
    && rm /tmp/maven.tar.gz

ENV PATH="/opt/maven/bin:${PATH}"

RUN mvn -q -DskipTests package

EXPOSE 8080

CMD ["java", "-jar", "target/property-market-service-1.0.0.jar"]
