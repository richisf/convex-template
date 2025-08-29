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

// Zone fallback list
const ZONES = [
  'us-central1-a',
  'us-central1-b',
  'us-central1-c',
  'us-west1-a',
  'us-west1-b',
  'europe-west1-a',
  'europe-west1-b',
];

export async function create(
  repository: RepositoryInfo,
  devServerSetup?: DevServerSetup
): Promise<VMCreateResult> {
  try {
    const machineName = `${repository.name}-vm-${Date.now()}`;

    for (const zone of ZONES) {
      try {

        const machineState = await createMachine(machineName, zone);

        await setupSystem(machineState);

        let devServerResult;

        if (repository.accessToken && repository.fullName) {

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
        }

        return {
          success: true,
          name: machineName,
          zone: zone,
          machineState: machineState,
          devServer: devServerResult
        };

      } catch (error) {
        console.error(`❌ Failed to create VM in zone ${zone}:`, error);

        // Only retry for zone-specific resource issues
        const isZoneRetryableError =
          error instanceof Error && (
            error.message.includes('503') ||
            error.message.includes('SERVICE UNAVAILABLE') ||
            error.message.includes('does not have enough resources available') ||
            error.message.includes('ZONE_RESOURCE_POOL_EXHAUSTED') ||
            error.message.includes('RESOURCE_POOL_EXHAUSTED')
          );

        if (!isZoneRetryableError) {
          // For non-zone-specific errors, don't retry zones
          throw error;
        }

        console.log(`❌ Zone ${zone} unavailable/exhausted, trying next zone...`);
      }
    }

    return {
      success: false,
      name: "",
      zone: "",
      error: "Failed to create VM in any available zone",
    };

  } catch (error) {
    console.error("❌ VM creation failed:", error);
    return {
      success: false,
      name: "",
      zone: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
