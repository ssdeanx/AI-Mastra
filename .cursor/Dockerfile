# AI-Mastra Dockerfile for Cursor Background Agent
# Sets up environment only - code is cloned by the agent

FROM node:20.18-alpine

# Install minimal dependencies
RUN apk add --no-cache git

# Install mastra CLI globally
RUN npm install -g mastra@latest

# Create working directory
WORKDIR /workspace

# Create user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S agent -u 1001 -G nodejs

# Change ownership of workspace
RUN chown -R agent:nodejs /workspace

# Switch to non-root user
USER agent

# The project will be cloned here by the Cursor Background Agent
# No COPY commands needed - the agent handles the code
