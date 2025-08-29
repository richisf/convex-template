"use node";

import { runCommand } from "../../connect";
import { MachineState } from "../../create";

export async function setupHttpsNginx(
  machineState: MachineState,
  domain: string,
  certPath: string,
  port: number
): Promise<void> {
  console.log('🔒 Updating nginx configuration to include HTTPS...');

  const httpsConfig = `
server {
    listen 80;
    server_name ${domain};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate ${certPath}/fullchain.pem;
    ssl_certificate_key ${certPath}/privkey.pem;

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

        # Retry and error handling
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;

        # Keep connections alive
        proxy_set_header Connection "";
    }
}`;

  await runCommand(machineState,
    `echo '${httpsConfig}' | sudo tee /etc/nginx/sites-available/${domain}`
  );

  // Test nginx configuration
  const testResult = await runCommand(machineState, `sudo nginx -t`);
  if (testResult.code !== 0) {
    console.log('❌ nginx configuration test failed:', testResult.stderr);
    console.log('🔄 Falling back to HTTP-only configuration');
    await setupHttpFallback(machineState, domain, port);
    return;
  }

  console.log('✅ nginx configuration test passed');

  // Restart nginx for HTTPS changes
  console.log('🔄 Restarting nginx to ensure HTTPS binding...');
  const restartResult = await runCommand(machineState, `sudo systemctl restart nginx`);
  if (restartResult.code !== 0) {
    console.log('❌ nginx restart failed:', restartResult.stderr);
    throw new Error(`nginx restart failed: ${restartResult.stderr}`);
  }

  // Wait and verify nginx is listening on port 443
  await new Promise(resolve => setTimeout(resolve, 5000));

  const portCheck = await runCommand(machineState, `sudo netstat -tlnp | grep nginx`);
  console.log('📊 nginx listening ports (netstat):', portCheck.stdout);

  const ssCheck = await runCommand(machineState, `sudo ss -tlnp | grep :443 || echo "NO_443"`);
  console.log('📊 Port 443 check (ss):', ssCheck.stdout);

  if (!portCheck.stdout.includes(':443') && ssCheck.stdout.includes('NO_443')) {
    console.log('❌ nginx not listening on port 443 - debugging...');

    // Debug nginx status and logs
    const statusCheck = await runCommand(machineState, `sudo systemctl status nginx --no-pager -l`);
    console.log('📊 nginx status:', statusCheck.stdout);

    const errorLogs = await runCommand(machineState,
      `sudo tail -20 /var/log/nginx/error.log 2>/dev/null || echo "No error logs"`
    );
    console.log('📊 nginx error logs:', errorLogs.stdout);

    const certCheck = await runCommand(machineState, `sudo ls -la ${certPath}/`);
    console.log('🔍 SSL certificate files:', certCheck.stdout);

    if (certCheck.code !== 0) {
      throw new Error('SSL certificate files not found and nginx not listening on 443');
    } else {
      const configTest = await runCommand(machineState, `sudo nginx -t`);
      console.log('📊 nginx config test result:', configTest.stdout, configTest.stderr);
      throw new Error('nginx has SSL certificates but is not listening on port 443');
    }
  } else {
    console.log('✅ nginx successfully listening on port 443');
  }

  console.log('✅ HTTPS configuration activated');
}

async function setupHttpFallback(
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

  await runCommand(machineState,
    `echo '${httpConfig}' | sudo tee /etc/nginx/sites-available/${domain}`
  );
  await runCommand(machineState, `sudo systemctl reload nginx`);
}
