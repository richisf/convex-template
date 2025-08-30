"use node";

import { createMachine } from "./machine/create";
import { MachineState } from "./machine/create";
import { setupSystem } from "./machine/operations/system";
import { setupRepository, RepositoryConfig } from "./machine/operations/repository";
import { startDevServer, DevServerConfig } from "./machine/operations/devServer";
import { setupSSL, SSLConfig } from "./machine/operations/ssl";

export interface RepositoryInfo {
  _id: string;
  name: string;
  githubUserId: string;
  userId?: string;
  isDefault?: boolean;
  _creationTime?: number;
  // GitHub information populated by the query
  accessToken?: string;
  fullName?: string;
  envVars?: Array<{ key: string; value: string }>;
}

export interface DevServerSetup {
  domain?: string;
  port?: number;
  email?: string;
}

export interface VMCreateResult {
  success: boolean;
  name: string;
  zone: string;
  machineState?: MachineState;
  devServer?: {
    httpUrl: string;
    httpsUrl?: string;
  };
  error?: string;
}

// Zone fallback list - prioritize us-central1 to match existing static IP
const ZONES = [
  'us-central1-a',
  'us-central1-b',
  'us-central1-c',
  'us-central1-f',
  'us-west1-a',
  'us-west1-b',
  'us-west1-c',
  'europe-west1-a',
  'europe-west4-a',
  'europe-west3-b',
  'europe-west4-b',
  'europe-west5-a',
  'europe-west1-b',
  'europe-west2-a',
  'europe-west2-b',
  'europe-west3-a',

];

export async function create(
  repository: RepositoryInfo,
  devServerSetup?: DevServerSetup
): Promise<VMCreateResult> {
  try {
    // Create new machine
    const machineName = `${repository.name}-vm-${Date.now()}`;
    let machineState: MachineState | undefined;

    for (const zone of ZONES) {
      try {
        machineState = await createMachine(machineName, zone);
        break;
      } catch (error) {
        console.error(`❌ Failed to create VM in zone ${zone}:`, error);
        machineState = undefined; 
      }
    }

    if (!machineState) {
      throw new Error("Failed to create VM in any available zone");
    }

    await setupSystem(machineState);

    let devServerResult;

    if (repository.accessToken && repository.fullName) {
      console.log(`✅ Repository setup conditions met - proceeding with repo setup`);

      const repoConfig: RepositoryConfig = {
        fullName: repository.fullName,
        accessToken: repository.accessToken,
        repoDir: repository.name,
        envVars: repository.envVars || []
      };

      const repoResult = await setupRepository(machineState, repoConfig);

      const devServerConfig: DevServerConfig = {
        repoPath: repoResult.repoPath,
        port: devServerSetup?.port || 3000,
        domain: devServerSetup?.domain
      };

      devServerResult = await startDevServer(machineState, devServerConfig);

      if (devServerSetup?.domain) {
        const sslConfig: SSLConfig = {
          domain: devServerSetup.domain,
          email: devServerSetup.email,
          port: devServerSetup.port || 3000
        };

        const sslResult = await setupSSL(machineState, sslConfig);

        if (sslResult.certPath) {
          console.log(`🔒 SSL certificate configured for ${sslResult.domain}`);
          devServerResult.httpsUrl = `https://${sslResult.domain}`;
        } else {
          console.log('⚠️ SSL setup failed, continuing with HTTP only');
        }
      }
    } else {
      console.log(`❌ Repository setup SKIPPED - missing required data:`);
    }

    return {
      success: true,
      name: machineName,
      zone: machineState.zone,
      machineState: machineState,
      devServer: devServerResult
    };

  } catch (error) {
    console.error("❌ Machine setup failed:", error);
    return {
      success: false,
      name: "",
      zone: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
