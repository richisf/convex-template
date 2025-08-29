"use node";

import { MachineState } from "../create";
import { setupPM2, PM2Config } from "./devServer/pm2";
import { setupHealthMonitor, HealthConfig } from "./devServer/health";

export interface DevServerConfig {
  repoPath: string;
  port?: number;
  domain?: string;
}

export async function startDevServer(
  machineState: MachineState,
  config: DevServerConfig
): Promise<{ httpUrl: string; httpsUrl?: string }> {
  console.log('🚀 Starting dev server with PM2...');

  const { repoPath, port = 3000, domain } = config;
  const sshUser = machineState.sshUser;

  // Step 1: Setup PM2 process management
  const pm2Config: PM2Config = {
    repoPath,
    port,
    sshUser
  };
  await setupPM2(machineState, pm2Config);

  // Step 2: Setup health monitoring
  const healthConfig: HealthConfig = {
    sshUser
  };
  await setupHealthMonitor(machineState, healthConfig);

  const httpUrl = `http://${machineState.ip}:${port}`;
  const httpsUrl = domain ? `https://${domain}` : undefined;

  console.log(`🌐 Internal HTTP server: ${httpUrl}`);
  if (httpsUrl) {
    console.log(`🌐 Public HTTPS access: ${httpsUrl}`);
  }

  return { httpUrl, httpsUrl };
}
