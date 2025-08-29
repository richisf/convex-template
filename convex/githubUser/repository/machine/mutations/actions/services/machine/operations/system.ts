"use node";

import { runCommand } from "../connect";
import { MachineState } from "../create";

export async function setupSystem(machineState: MachineState): Promise<void> {
  console.log('🚀 Starting complete system setup...');

  try {
    // Step 1: Prepare system (updates + basic dependencies)
    console.log('📦 Updating system...');
    await runCommand(machineState, `
      sudo rm -rf /var/lib/apt/lists/* && \
      sudo apt-get clean && \
      sudo apt-get update -y && \
      sudo apt-get upgrade -y
    `);
    console.log('✅ System updated');

    console.log('📦 Installing basic dependencies...');
    await runCommand(machineState, `
      sudo apt-get install -y curl git python3 python3-pip build-essential netcat-openbsd
    `);
    console.log('✅ Basic dependencies installed');

    // Step 2: Install Node.js
    console.log('📥 Installing Node.js...');
    await runCommand(machineState, `
      curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash - && \
      sudo apt-get install -y nodejs
    `);
    console.log('✅ Node.js installed');

    // Verify Node.js installation
    console.log('🔍 Verifying Node.js installation...');
    const nodeVerify = await runCommand(machineState, 'which node && node --version && which npm && npm --version');
    if (nodeVerify.code !== 0) {
      throw new Error(`Node.js verification failed: ${nodeVerify.stderr}`);
    }
    console.log('✅ Node.js verification passed');

    // Step 3: Optimize system settings
    console.log('⚡ Optimizing system settings for Node.js...');
    await runCommand(machineState, `
      echo 'net.core.somaxconn=65535' | sudo tee -a /etc/sysctl.conf && \
      sudo sysctl -p
    `);
    console.log('✅ System optimized for Node.js stability');

    // Step 4: Install PM2 and Claude
    console.log('⚡ Installing PM2 and Claude...');
    const sshUser = machineState.sshUser;

    // Install PM2 globally
    await runCommand(machineState, `sudo npm install -g pm2 --force`);
    console.log('✅ PM2 installed');

    // Setup Claude workspace
    await runCommand(machineState, `
      mkdir -p /home/${sshUser}/claude_workspace && \
      cd /home/${sshUser}/claude_workspace && \
      npm init -y && \
      npm install @anthropic-ai/claude-code --save
    `);
    console.log('✅ Claude workspace prepared');

    // Step 5: Setup Claude environment
    console.log('🔧 Setting up Claude environment...');
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? '';

    await runCommand(machineState, `
      echo 'export ANTHROPIC_API_KEY="${anthropicApiKey}"' | sudo tee /home/${sshUser}/anthropic.env && \
      sudo chown ${sshUser}:${sshUser} /home/${sshUser}/anthropic.env && \
      sudo chmod 600 /home/${sshUser}/anthropic.env
    `);

    // Final verification
    console.log('🔍 Final verification...');
    const verifyResult = await runCommand(machineState, `
      npm list -g pm2 >/dev/null 2>&1 && echo "PM2: ✓" || echo "PM2: ✗" && \
      cd ~/claude_workspace && npm list @anthropic-ai/claude-code >/dev/null 2>&1 && echo "Claude: ✓" || echo "Claude: ✗" && \
      source ~/anthropic.env && [ -n "$ANTHROPIC_API_KEY" ] && echo "API Key: ✓" || echo "API Key: ✗"
    `);

    console.log('System setup verification:', verifyResult.stdout);
    console.log('✅ System setup completed successfully');

  } catch (error) {
    console.error('❌ System setup failed:', error);
    throw new Error(`System setup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}


