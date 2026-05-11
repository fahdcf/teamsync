@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.2
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET %%__MVNW_ARG0_NAME__%%=
@IF "%MAVEN_WRAPPER_QUIET_MODE%"=="" (@SET MAVEN_WRAPPER_QUIET_MODE=false)

@SET WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"
@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@SET DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"

@FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%~dp0.mvn\wrapper\maven-wrapper.properties") DO (
  @IF "%%A"=="wrapperUrl" SET DOWNLOAD_URL=%%B
)

@IF NOT "%MVNW_VERBOSE%"=="true" @ECHO OFF

IF "%MVNW_USERNAME%"=="" (
  SET MVNW_USERNAME=
)
IF "%MVNW_PASSWORD%"=="" (
  SET MVNW_PASSWORD=
)

set WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"

IF EXIST %WRAPPER_JAR% (
    CALL :MavenWrapperJarMain %*
) ELSE (
    CALL :DownloadJar
    IF ERRORLEVEL 1 (
        ECHO Could not download Maven wrapper jar. ^
Ensure you have internet access.
        EXIT /B 1
    )
    CALL :MavenWrapperJarMain %*
)
EXIT /B %ERRORLEVEL%

:MavenWrapperJarMain
SET JAVA_EXE=java.exe
IF NOT "%JAVA_HOME%"=="" SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
%JAVA_EXE% -cp %WRAPPER_JAR% %WRAPPER_LAUNCHER% %MAVEN_CONFIG% %*
EXIT /B %ERRORLEVEL%

:DownloadJar
SET JAVA_EXE=java.exe
IF NOT "%JAVA_HOME%"=="" SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
%JAVA_EXE% -classpath "" org.apache.maven.wrapper.MavenWrapperDownloader %DOWNLOAD_URL% ".mvn\wrapper\maven-wrapper.jar"
EXIT /B %ERRORLEVEL%
