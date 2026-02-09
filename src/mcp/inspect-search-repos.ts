import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) throw new Error('Set GITHUB_PERSONAL_ACCESS_TOKEN');
  const transport = new StdioClientTransport({
    command: 'github-mcp-server',
    args: ['stdio', '--read-only', '--toolsets=default'],
    env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: token } as Record<string,string>,
    stderr: 'inherit'
  });
  const client = new Client({ name: 'inspect', version: '0.1.0' }, { capabilities: {} });
  await client.connect(transport);
  const { tools } = await client.listTools();
  console.log(JSON.stringify(tools.find(t => t.name === 'search_repositories'), null, 2));
  await client.close();
}
main();
