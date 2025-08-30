"use node";

import { runCommand } from "../connect";
import { MachineState } from "../create";

export interface RepositoryConfig {
  fullName: string; // e.g., "owner/repo"
  repoDir?: string;
  accessToken: string;
  envVars?: Array<{ key: string; value: string }>;
  convexTeamId?: string; // Team ID for the Convex team (CONVEX_API_TOKEN read from env)
}



export async function setupRepository(
  machineState: MachineState,
  config: RepositoryConfig
): Promise<{ repoPath: string; repoUrl: string }> {

  const { repoDir = "claude_repo", accessToken, fullName, envVars = [], convexTeamId } = config;
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

  // Step 2: Create Convex project if team ID is provided
  let convexUrl: string | undefined;
  if (convexTeamId) {
    try {
      // Generate a unique project name based on repo and timestamp
      const projectName = `${fullName.replace('/', '-')}-${Date.now()}`;

      const teamToken = process.env.CONVEX_API_TOKEN;
      if (!teamToken) {
        throw new Error('CONVEX_API_TOKEN environment variable is not set');
      }

      console.log('🔧 Creating new Convex project...');

      const response = await fetch(`https://api.convex.dev/v1/teams/${convexTeamId}/create_project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${teamToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName,
          deploymentType: "prod",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create Convex project: ${response.status} ${errorText}`);
      }

      const projectData = await response.json();
      console.log('✅ Convex project created successfully');

      // The response should contain the project URL
      convexUrl = projectData.url || projectData.deploymentUrl;
      if (!convexUrl) {
        throw new Error('No Convex URL returned from API response');
      }

      console.log(`📡 Convex URL generated: ${convexUrl}`);
    } catch (error) {
      console.error('❌ Failed to create Convex project:', error);
      // Continue without Convex URL - the app might work without it initially
    }
  }

  // Step 3: Create environment files
  console.log('⚙️ Creating environment files...');
  const envContent = createEnvFileContent(3000, envVars, convexUrl);

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

function createEnvFileContent(
  port: number,
  envVars: Array<{ key: string; value: string }>,
  convexUrl?: string
): string {
  const lines = [
    `PORT=${port}`,
    `HOST=0.0.0.0`,
    `NODE_ENV=development`,
    ...envVars.map(env => `${env.key}=${env.value}`)
  ];

  // Add Convex URL if provided
  if (convexUrl) {
    lines.push(`NEXT_PUBLIC_CONVEX_URL=${convexUrl}`);
  }

  return lines.join('\n');
}
