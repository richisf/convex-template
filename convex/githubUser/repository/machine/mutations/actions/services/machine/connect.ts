"use node";

import { MachineState } from "./create";

export async function runCommand(
  machineState: MachineState,
  command: string,
  options?: {
    timeout?: number; // in seconds
    maxAttempts?: number;
    retryInterval?: number; // in milliseconds
  }
): Promise<{ code: number | null; stdout: string; stderr: string }> {

  const {
    timeout = 60, // 60 seconds default timeout
    maxAttempts = 5, // Reduced from 10 to be more responsive
    retryInterval = 3000 // 3 seconds between attempts
  } = options || {};

  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // Check connection status
      if (!machineState.ssh.isConnected()) {
        console.log(`🔗 Connecting to ${machineState.ip}... (attempt ${attempts + 1}/${maxAttempts})`);
        await machineState.ssh.connect({
          host: machineState.ip!,
          username: machineState.sshUser,
          privateKey: machineState.sshPrivateKeyContent,
          passphrase: machineState.sshKeyPassphrase,
          readyTimeout: 10000, // 10 second connection timeout
        });
        console.log(`✅ Connected to ${machineState.ip}`);
      }

      // Execute command with timeout
      console.log(`🔄 Executing: ${command.substring(0, 50)}${command.length > 50 ? '...' : ''}`);

      const result = await Promise.race([
        machineState.ssh.execCommand(command),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Command timed out after ${timeout} seconds`)), timeout * 1000)
        )
      ]);

      console.log(`✅ Command completed with exit code: ${result.code}`);
      return result;

    } catch (error) {
      attempts++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Command failed (attempt ${attempts}/${maxAttempts}): ${errorMessage}`);

      if (attempts >= maxAttempts) {
        throw new Error(`Command failed after ${maxAttempts} attempts: ${errorMessage}`);
      }

      // Force reconnection on retry
      try {
        if (machineState.ssh.isConnected()) {
          machineState.ssh.dispose();
        }
      } catch (disposeError) {
        console.log('⚠️ Error disposing SSH connection:', disposeError instanceof Error ? disposeError.message : disposeError);
      }

      console.log(`🔄 Retrying in ${retryInterval/1000} seconds...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }

  throw new Error(`Failed to execute command after ${maxAttempts} attempts`);
}


