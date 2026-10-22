#!/bin/sh
set -e

#To start the ServiceNow MCP server
echo "Starting MCP Server..."
# python3 mcp_servers/servicenow_mcp.py &
nohup python3 mcp_servers/servicenow_mcp.py > logs/servicenow_mcp.log 2>&1 &


