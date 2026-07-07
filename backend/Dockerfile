FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["src/HR.Api/HR.Api.csproj", "HR.Api/"]
COPY ["src/HR.Application/HR.Application.csproj", "HR.Application/"]
COPY ["src/HR.Domain/HR.Domain.csproj", "HR.Domain/"]
COPY ["src/HR.Infrastructure/HR.Infrastructure.csproj", "HR.Infrastructure/"]
RUN dotnet restore "HR.Api/HR.Api.csproj"

COPY src/ .
WORKDIR "/src/HR.Api"
RUN dotnet build "HR.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HR.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HR.Api.dll"]
