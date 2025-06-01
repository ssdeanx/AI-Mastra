# MCP Registry

Based on information gathered from:
*   GitHub Repository: [https://github.com/modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry)

## Description
A community-driven registry service for Model Context Protocol (MCP) servers.

## Development Status
Early stages of development.

## Features
*   RESTful API for managing MCP registry entries (list, get, create, update, delete)
*   Health check endpoint
*   Support for various environment configurations
*   Graceful shutdown handling
*   MongoDB and in-memory database support
*   Comprehensive API documentation
*   Pagination support

## Getting Started
Refer to the GitHub repository for instructions on running with Docker Compose or building and running locally with Go.

## API Documentation
Available via Swagger UI at `/v0/swagger/index.html`.

## API Endpoints
*   `GET /v0/health` (Health Check)
*   `GET /v0/servers` (List Registry Server Entries)
*   `GET /v0/servers/{id}` (Get Server Details)
*   `POST /v0/publish` (Publish a Server Entry)
*   `GET /v0/ping` (Ping Endpoint)

## Configuration
Configured using environment variables. See the GitHub repository for details.