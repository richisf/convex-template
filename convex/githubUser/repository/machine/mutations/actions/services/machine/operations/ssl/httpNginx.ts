"use node";

import { runCommand } from "../../connect";
import { MachineState } from "../../create";

export async function setupHttpOnlyNginx(
  machineState: MachineState,
  domain: string,
  port: number
): Promise<void> {
  const httpConfig = `
server {
    listen 80;
    server_name ${domain};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }
}`;

  await runCommand(machineState, `sudo mkdir -p /etc/nginx/sites-available /var/www/html`);
  await runCommand(machineState,
    `echo '${httpConfig}' | sudo tee /etc/nginx/sites-available/${domain}`
  );
  await runCommand(machineState,
    `sudo ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/`
  );
  await runCommand(machineState, `sudo rm -f /etc/nginx/sites-enabled/default`);

  // Test and restart nginx
  const testResult = await runCommand(machineState, `sudo nginx -t`);
  if (testResult.code !== 0) {
    throw new Error(`nginx configuration test failed: ${testResult.stderr}`);
  }

  await runCommand(machineState, `sudo systemctl restart nginx`);
  console.log('✅ HTTP-only nginx configuration activated');
}
