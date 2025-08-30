"use node";

import { runCommand } from "../../connect";
import { MachineState } from "../../create";

export interface PM2Config {
  repoPath: string;
  port: number;
  sshUser: string;
}

export async function setupPM2(
  machineState: MachineState,
  config: PM2Config
): Promise<void> {
  const { repoPath, port, sshUser } = config;

  // Step 1: Stop existing servers
  console.log('🔄 Stopping any existing dev servers...');
  await runCommand(machineState,
    `cd ${repoPath} && pm2 delete dev-server || true`
  );
  await runCommand(machineState, `sudo fuser -k ${port}/tcp || true`);

  // Step 2: Fix file permissions
  console.log('🔧 Fixing file permissions...');
  await runCommand(machineState,
    `cd ${repoPath} && sudo chown -R ${sshUser}:${sshUser} . && chmod -R 755 .`
  );

  // Step 3: Add dev:stable script if missing
  const scriptCheck = await runCommand(machineState,
    `cd ${repoPath} && npm run --silent | grep "dev:stable" || echo "SCRIPT_MISSING"`
  );

  if (scriptCheck.stdout.includes('SCRIPT_MISSING')) {
    console.log('⚠️ dev:stable script missing, adding fallback...');
    await runCommand(machineState,
      `cd ${repoPath} && npm pkg set scripts.dev:stable="WATCHPACK_POLLING=true next dev --port ${port} --hostname 0.0.0.0"`
    );
    console.log('✅ Added fallback dev:stable script to package.json');
  } else {
    console.log('✅ dev:stable script found in package.json');
  }

  // Step 4: Create PM2 ecosystem configuration
  const pm2Config = {
    apps: [{
      name: "dev-server",
      script: "npm",
      args: "run dev:stable",
      cwd: repoPath,
      env: {
        PORT: port.toString(),
        HOST: "0.0.0.0",
        NODE_ENV: "development",
        NODE_OPTIONS: "--max-old-space-size=3072",
        WATCHPACK_POLLING: "true",
        NEXT_TELEMETRY_DISABLED: "1",
        UV_THREADPOOL_SIZE: "4",
        CHOKIDAR_USEPOLLING: "true",
        CHOKIDAR_INTERVAL: "2000",
        FORCE_COLOR: "0"
      },
      max_memory_restart: "3584M",
      restart_delay: 8000,
      max_restarts: 15,
      min_uptime: "45s",
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 15000,
      listen_timeout: 20000,
      autorestart: true,
      ignore_watch: [
        "node_modules",
        ".git",
        "*.log",
        ".next",
        ".claude_workspace",
        "claude_workspace",
        "*.tmp",
        ".anthropic",
        ".env*"
      ],
      error_file: "/tmp/dev-server-error.log",
      out_file: "/tmp/dev-server-out.log",
      merge_logs: true,
      time: true,
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: true,
      exp_backoff_restart_delay: 100,
      watch: true,
      shutdown_with_message: true
    }]
  };

  // Step 5: Write and start PM2 config
  await runCommand(machineState,
    `cd ${repoPath} && echo '${JSON.stringify(pm2Config, null, 2)}' > ecosystem.config.json`
  );

  const startResult = await runCommand(machineState,
    `cd ${repoPath} && pm2 start ecosystem.config.json`
  );
  console.log('PM2 start result:', startResult.stdout);

  // Step 6: Wait for startup and check status
  console.log('🔍 Waiting for PM2 to start dev server...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  const statusResult = await runCommand(machineState, `pm2 status dev-server`);
  console.log('PM2 status:', statusResult.stdout);

  const logsResult = await runCommand(machineState,
    `pm2 logs dev-server --lines 10 --nostream || echo "No logs available"`
  );
  console.log('Recent PM2 logs:', logsResult.stdout);

  console.log(`✅ Dev server started with PM2 on port ${port}`);
  console.log(`📋 Server will restart automatically if it crashes. Logs: pm2 logs dev-server`);
}
