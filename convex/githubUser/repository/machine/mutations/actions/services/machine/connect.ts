"use node";

import { MachineState } from "./create";

export async function runCommand(
  machineState: MachineState,
  command: string
): Promise<{ code: number | null; stdout: string; stderr: string }> {

  let attempts = 0;
  const maxAttempts = 10;
  const retryInterval = 5000; // 5 seconds between attempts

  while (attempts < maxAttempts) {
    try {

        if (!machineState.ssh.isConnected()) {
        console.log(`🔗 Connecting to ${machineState.ip}...`);
        await machineState.ssh.connect({
          host: machineState.ip!,
          username: machineState.sshUser,
          privateKey: machineState.sshPrivateKeyContent,
          passphrase: machineState.sshKeyPassphrase,
        });
        console.log(`✅ Connected`);
      }

      // Execute command
      return await machineState.ssh.execCommand(command);

    } catch (error) {
      attempts++;
      console.log(`❌ Command failed (attempt ${attempts}):`, error instanceof Error ? error.message : error);

      if (attempts >= maxAttempts) {
        throw error;
      }

      // Force reconnection on retry
      try {
        machineState.ssh.dispose();
      } catch {
        // Ignore dispose errors
      }

      console.log(`🔄 Retrying in ${retryInterval/1000} seconds...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }

  throw new Error(`Failed to execute command after ${maxAttempts} attempts`);
}


