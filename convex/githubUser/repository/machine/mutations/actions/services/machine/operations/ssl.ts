"use node";

import { runCommand } from "../connect";
import { MachineState } from "../create";
import { setupHttpOnlyNginx } from "./ssl/httpNginx";
import { obtainCertificate } from "./ssl/certificate";
import { setupHttpsNginx } from "./ssl/httpsNginx";

export interface SSLConfig {
  domain: string;
  email?: string;
  port?: number;
}

export async function setupSSL(
  machineState: MachineState,
  config: SSLConfig
): Promise<{ domain: string; certPath?: string }> {
  console.log(`🔒 Setting up SSL certificate for ${config.domain}`);

  const { domain, email = "admin@whitenode.dev", port = 3000 } = config;

  // Step 1: Install certbot and nginx
  console.log('📦 Installing certbot and nginx...');
  await runCommand(machineState, 'sudo apt update && sudo apt install -y certbot nginx');
  console.log('✅ SSL tools installed');

  // Step 2: Create HTTP-only nginx config for SSL certificate generation
  console.log('🔧 Setting up initial HTTP-only nginx configuration...');
  await setupHttpOnlyNginx(machineState, domain, port);

  // Step 3: Obtain new SSL certificate (always create fresh)
  console.log('🔒 Obtaining new SSL certificate...');
  const certResult = await obtainCertificate(machineState, domain, email);

  if (certResult.success) {
    console.log('✅ SSL certificate obtained successfully');
    const finalCertPath = `/etc/letsencrypt/live/${domain}`;
    await setupHttpsNginx(machineState, domain, finalCertPath, port);
    return { domain, certPath: finalCertPath };
  } else {
    console.log('⚠️ SSL certificate generation failed, continuing with HTTP-only setup');
    console.log('🌐 The dev server will be accessible via HTTP only');
    return { domain };
  }
}
