import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    if (!config.host || !config.username) {
      return NextResponse.json(
        { success: false, error: 'Host and username are required' },
        { status: 400 }
      );
    }

    // Dynamic import for ssh2
    const { Client } = await import('ssh2');

    // Test the SSH connection
    const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const conn = new Client();
      
      const timeout = setTimeout(() => {
        conn.end();
        resolve({ success: false, error: 'Connection timeout' });
      }, 10000);

      conn.on('ready', () => {
        clearTimeout(timeout);
        conn.end();
        resolve({ success: true });
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      });

      const connectConfig: Record<string, unknown> = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
        readyTimeout: 10000,
      };

      if (config.privateKey) {
        connectConfig.privateKey = config.privateKey;
      } else if (config.password) {
        connectConfig.password = config.password;
      }

      conn.connect(connectConfig);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to test connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
