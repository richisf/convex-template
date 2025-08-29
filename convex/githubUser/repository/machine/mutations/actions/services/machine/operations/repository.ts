"use node";

import { runCommand } from "../connect";
import { MachineState } from "../create";

export interface RepositoryConfig {
  fullName: string; // e.g., "owner/repo"
  repoDir?: string;
  accessToken: string;
  envVars?: Array<{ key: string; value: string }>;
}

export async function setupRepository(
  machineState: MachineState,
  config: RepositoryConfig
): Promise<{ repoPath: string; repoUrl: string }> {

  const { repoDir = "claude_repo", accessToken, fullName, envVars = [] } = config;
  const repoPath = `/home/${machineState.sshUser}/${repoDir}`;
  const repoUrl = `https://${accessToken}@github.com/${fullName}.git`;

  console.log('📂 Cloning repository...');
  const cloneResult = await runCommand(machineState,
    `rm -rf ${repoPath} && git clone ${repoUrl} ${repoPath}`
  );

  if (cloneResult.code !== 0) {
    console.error('❌ Git clone failed:', cloneResult.stderr);
    throw new Error(`Repository clone failed: ${cloneResult.stderr}`);
  }
  console.log('✅ Repository cloned successfully');

  // Step 2: Create environment files
  console.log('⚙️ Creating environment files...');
  const envContent = createEnvFileContent(3000, envVars);

  await runCommand(machineState,
    `cd ${repoPath} && echo '${envContent}' > .env && cp .env .env.local`
  );

  const npmCheck = await runCommand(machineState, 'which npm && npm --version');
  if (npmCheck.code !== 0) {
    throw new Error(`npm not available: ${npmCheck.stderr}`);
  }

  const installResult = await runCommand(machineState, `cd ${repoPath} && npm install`);
  if (installResult.code !== 0) {
    console.error('❌ npm install failed:', installResult.stderr);
    throw new Error(`npm install failed: ${installResult.stderr}`);
  }

  return { repoPath, repoUrl };
}

function createEnvFileContent(port: number, envVars: Array<{ key: string; value: string }>): string {
  const lines = [
    `PORT=${port}`,
    `HOST=0.0.0.0`,
    `NODE_ENV=development`,
    ...envVars.map(env => `${env.key}=${env.value}`)
  ];

  return lines.join('\n');
}
