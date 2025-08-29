"use node";

import { InstancesClient, ZoneOperationsClient } from '@google-cloud/compute';
import { NodeSSH } from 'node-ssh';

/**
 * Google Cloud Platform credentials structure
 */
export interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

export interface MachineState {
  machineName: string;
  projectId: string;
  zone: string;
  credentials: GoogleCredentials;
  instancesClient: InstancesClient;
  operationsClient: ZoneOperationsClient;
  ssh: NodeSSH;
  sshUser: string;
  sshPrivateKeyContent?: string;
  sshKeyPassphrase?: string;
  ip?: string;
}


export async function createMachine(name: string, zone: string): Promise<MachineState> {
  const decoded = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS!, 'base64').toString();
  const credentials = JSON.parse(decoded) as GoogleCredentials;
  const gcpProjectId = credentials.project_id;

  const clientOptions = {
    projectId: gcpProjectId,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  };

  const instancesClient = new InstancesClient(clientOptions);
  const operationsClient = new ZoneOperationsClient(clientOptions);

  const machineState: MachineState = {
    machineName: name,
    projectId: gcpProjectId,
    zone: zone,
    credentials,
    instancesClient,
    operationsClient,
    ssh: new NodeSSH(),
    sshUser: 'ubuntu',
    sshPrivateKeyContent: process.env.GCP_SSH_PRIVATE_KEY,
    sshKeyPassphrase: process.env.GCP_SSH_KEY_PASSPHRASE,
    ip: undefined,
  };

  console.log(`Creating VM instance: ${name} in zone ${zone} for project ${gcpProjectId}...`);

  // SSH Configuration
  const sshPublicKeyPath = process.env.GCP_SSH_PUBLIC_KEY_PATH;
  const sshPublicKeyContent = process.env.GCP_SSH_PUBLIC_KEY;
  const STATIC_VM_IP = '34.102.136.180';

  if (!sshPublicKeyContent) {
    throw new Error(`SSH public key not found at: ${sshPublicKeyPath} and no GCP_SSH_PUBLIC_KEY environment variable provided.`);
  }

  // COMPLETE VM CONFIGURATION (creation + SSH + network + security)
  const instanceResource = {
    name: name,
    machineType: `zones/${zone}/machineTypes/n1-standard-2`,
    disks: [
      {
        boot: true,
        autoDelete: true,
        initializeParams: {
          sourceImage: 'projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts',
        },
      },
    ],
    networkInterfaces: [
      {
        name: 'global/networks/default',
        accessConfigs: [{
          name: 'External NAT',
          type: 'ONE_TO_ONE_NAT',
          natIP: STATIC_VM_IP
        }],
      },
    ],
    metadata: {
      items: [
        {
          key: 'ssh-keys',
          value: `${machineState.sshUser}:${sshPublicKeyContent}`,
        },
      ],
    },
    tags: {
      items: ['https-dev-server']
    }
  };

  const [insertCallResponse] = await instancesClient.insert({
    project: gcpProjectId,
    zone: zone,
    instanceResource,
  });

  const operationName = insertCallResponse.latestResponse?.name;

  const [operation] = await operationsClient.wait({
    operation: operationName,
    project: gcpProjectId,
    zone: zone,
  });

  if (operation.error) {
    const errorDetails = operation.error.errors?.map(e => e.message ?? 'Unknown error detail').join(', ');
    throw new Error(`Failed to create VM: ${errorDetails ?? operation.httpErrorMessage ?? 'Unknown error'}`);
  }

  console.log(`✅ VM created and configured successfully: ${name}`);
  return {
    ...machineState,
    ip: STATIC_VM_IP,
  };
}


