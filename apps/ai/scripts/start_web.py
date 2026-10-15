"""Launcher script to start both FastAPI backend and Next.js frontend concurrently."""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path


def main():
    repo_root = Path(__file__).resolve().parent.parent
    frontend_dir = repo_root / "frontend"

    print("=" * 65)
    print("  🚀 IOH-RAG-POC Web Assistant (Phase 2 Full-Stack Launcher)")
    print("=" * 65)

    if not frontend_dir.exists():
        print(f"Error: Frontend directory not found at {frontend_dir}")
        sys.exit(1)

    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "src.api.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(repo_root),
        env=os.environ.copy(),
    )

    # Allow backend 1 second to bind port
    time.sleep(1.0)

    print("[2/2] Starting Next.js Frontend on http://localhost:3000 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(frontend_dir),
        env=os.environ.copy(),
    )

    print("\n" + "-" * 65)
    print("  ✨ System is running!")
    print("  🌐 Web Interface: http://localhost:3000")
    print("  🔌 API & Swagger: http://127.0.0.1:8000/docs")
    print("  🛑 Press Ctrl+C to stop both servers")
    print("-" * 65 + "\n")

    def shutdown(signum, frame):
        print("\nStopping services...")
        try:
            frontend_proc.terminate()
        except Exception:
            pass
        try:
            backend_proc.terminate()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            time.sleep(0.5)
            # If any process died unexpectedly, abort
            if backend_proc.poll() is not None:
                print("Backend process exited unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend process exited unexpectedly.")
                break
    except KeyboardInterrupt:
        shutdown(None, None)


if __name__ == "__main__":
    main()
