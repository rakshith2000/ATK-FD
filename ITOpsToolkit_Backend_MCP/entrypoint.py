#!/usr/bin/env python3
import os
import subprocess
import sys

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)


def start_background(name: str, cmd: list[str], log_path: str) -> subprocess.Popen:
    """Start a background process, redirecting its output to a log file."""
    print(f"Starting {name}...", flush=True)
    log_file = open(log_path, "ab")
    return subprocess.Popen(
        cmd,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
    )


def main() -> None:
    proc = start_background(
        "MCP Server",
        [sys.executable, "/app/mcp_servers/servicenow_mcp.py"],
        os.path.join(LOG_DIR, "servicenow_mcp.log"),
    )
    exit_code = proc.wait()          
    sys.exit(exit_code)             


if __name__ == "__main__":
    main()
