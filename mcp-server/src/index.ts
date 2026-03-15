import { startServer } from './server';

const uid = process.env.TIMEKERNEL_UID;

if (!uid) {
  console.error('Error: TIMEKERNEL_UID environment variable is required');
  console.error('Usage: TIMEKERNEL_UID=your-uid npm start');
  process.exit(1);
}

startServer(uid).catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
