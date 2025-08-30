"use node";

import { runCommand } from "../../connect";
import { MachineState } from "../../create";

export interface HealthConfig {
  sshUser: string;
}

export async function setupHealthMonitor(
  machineState: MachineState,
  config: HealthConfig
): Promise<void> {
  const { sshUser } = config;

  console.log('📊 Setting up health monitoring...');

  // Simple health monitor - much shorter and won't timeout
  const healthScript = `#!/bin/bash
    # Simple health monitor for dev server
    while true; do
        # Check if dev server is responding
        if curl -f http://127.0.0.1:3000 --max-time 5 --silent --head > /dev/null 2>&1; then
            echo "$(date): Dev server OK" >> /tmp/health.log
        else
            echo "$(date): Dev server down - restarting..." >> /tmp/health.log
            pm2 restart dev-server || pm2 start dev-server
            sleep 10
        fi
        sleep 30
    done`;

  await runCommand(machineState,
    `echo '${healthScript}' > /home/${sshUser}/health-monitor.sh && chmod +x /home/${sshUser}/health-monitor.sh`
  );

  await runCommand(machineState,
    `cd /home/${sshUser} && pm2 start health-monitor.sh --name health-monitor`,
    { timeout: 30 }
  );

  console.log('✅ Health monitoring started');
}
