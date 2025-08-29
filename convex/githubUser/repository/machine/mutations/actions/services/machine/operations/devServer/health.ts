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

  console.log('📊 Setting up enhanced health monitoring...');

  const healthScript = `#!/bin/bash
# Enhanced health monitor for dev server with Claude awareness
LOG_FILE="/tmp/health-monitor.log"
RESTART_COUNT_FILE="/tmp/restart-count"
MAX_RAPID_RESTARTS=5
RAPID_RESTART_WINDOW=300 # 5 minutes

echo "$(date): Starting enhanced health monitor" >> $LOG_FILE

# Initialize restart counter
if [ ! -f "$RESTART_COUNT_FILE" ]; then
    echo "0:$(date +%s)" > $RESTART_COUNT_FILE
fi

while true; do
    # Check if dev server is responding
    if ! curl -f http://127.0.0.1:3000 --max-time 8 --silent --head > /dev/null 2>&1; then
        echo "$(date): Dev server not responding, checking PM2 status" >> $LOG_FILE

        # Read restart count and timestamp
        read -r count timestamp < "$RESTART_COUNT_FILE"
        current_time=$(date +%s)
        time_diff=$((current_time - timestamp))

        # Reset counter if outside rapid restart window
        if [ $time_diff -gt $RAPID_RESTART_WINDOW ]; then
            count=0
            timestamp=$current_time
        fi

        # Check if we're in rapid restart situation
        if [ $count -ge $MAX_RAPID_RESTARTS ]; then
            echo "$(date): Too many rapid restarts ($count), waiting 2 minutes before retry..." >> $LOG_FILE
            sleep 120
            count=0
            timestamp=$current_time
        fi

        # Check PM2 status and restart appropriately
        pm2_status=$(pm2 status dev-server --no-color | grep dev-server | awk '{print $10}')

        if [[ "$pm2_status" == "stopped" || "$pm2_status" == "errored" || "$pm2_status" == "error" ]]; then
            echo "$(date): PM2 process is down ($pm2_status), restarting..." >> $LOG_FILE
            pm2 restart dev-server
            count=$((count + 1))
            sleep 15
        elif [[ "$pm2_status" == "waiting" ]]; then
            echo "$(date): PM2 process waiting for restart, giving it time..." >> $LOG_FILE
            sleep 30
        else
            echo "$(date): PM2 process running ($pm2_status) but not responding, reloading..." >> $LOG_FILE
            pm2 reload dev-server
            count=$((count + 1))
            sleep 10
        fi

        # Update restart counter
        echo "$count:$timestamp" > "$RESTART_COUNT_FILE"

    else
        # Health check passed - log less frequently when healthy
        current_minute=$(date +%M)
        if [ $((current_minute % 5)) -eq 0 ]; then
            echo "$(date): Health check passed (dev server responding)" >> $LOG_FILE
        fi
    fi

    # Adaptive wait time - shorter when issues detected
    if [ -f "$RESTART_COUNT_FILE" ]; then
        read -r count _ < "$RESTART_COUNT_FILE"
        if [ $count -gt 0 ]; then
            sleep 20
        else
            sleep 45
        fi
    else
        sleep 45
    fi
done`;

  await runCommand(machineState,
    `echo '${healthScript}' > /home/${sshUser}/health-monitor.sh && chmod +x /home/${sshUser}/health-monitor.sh`
  );

  await runCommand(machineState,
    `cd /home/${sshUser} && pm2 start health-monitor.sh --name health-monitor --restart-delay 10000`
  );

  console.log('✅ Health monitoring started');
}
