"use node";

import { runCommand } from "../../connect";
import { MachineState } from "../../create";

export async function obtainCertificate(
  machineState: MachineState,
  domain: string,
  email: string
): Promise<{ success: boolean; certPath?: string }> {
  console.log(`🔒 Obtaining new SSL certificate for ${domain}...`);

  // Try webroot method first
  const webrootResult = await runCommand(machineState,
    `sudo certbot certonly --webroot -w /var/www/html -d ${domain} --non-interactive --agree-tos --email ${email}`
  );

  if (webrootResult.code === 0) {
    console.log('✅ SSL certificate obtained via webroot method');
    return { success: true, certPath: `/etc/letsencrypt/live/${domain}` };
  }

  console.log('❌ Webroot method failed, trying standalone method...');

  // Stop nginx temporarily for standalone method
  await runCommand(machineState, `sudo systemctl stop nginx`);

  const standaloneResult = await runCommand(machineState,
    `sudo certbot certonly --standalone -d ${domain} --non-interactive --agree-tos --email ${email}`
  );

  // Always restart nginx
  await runCommand(machineState, `sudo systemctl start nginx`);

  if (standaloneResult.code === 0) {
    console.log('✅ SSL certificate obtained via standalone method');
    return { success: true, certPath: `/etc/letsencrypt/live/${domain}` };
  }

  console.log('❌ Standalone SSL method also failed:', standaloneResult.stderr);

  // Check if it's a rate limit issue
  if (standaloneResult.stderr.includes('too many certificates') ||
      standaloneResult.stderr.includes('rate limit')) {
    console.log('⚠️ Rate limit hit - need to wait 7 days or use different subdomain');
    return { success: false };
  }

  console.log('❌ SSL certificate generation failed with both methods');
  return { success: false };
}
