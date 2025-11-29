import { Router } from "express";
import { pool } from "../db";
import { env } from "../env";
import { logger } from "../utils/logger";
import os from "os";

const router = Router();

async function checkDatabase(): Promise<{ ok: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();
  try {
    await pool.query('SELECT 1');
    return {
      ok: true,
      latency: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

function getMemoryUsage(): { ok: boolean; used: string; total: string; percentage: number } {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usedPercentage = Math.round((usedMemory / totalMemory) * 100);
  
  return {
    ok: usedMemory / totalMemory < 0.9,
    used: `${(usedMemory / (1024 ** 3)).toFixed(2)} GB`,
    total: `${(totalMemory / (1024 ** 3)).toFixed(2)} GB`,
    percentage: usedPercentage,
  };
}

router.get('/', async (req, res) => {
  try {
    const database = await checkDatabase();
    const memory = getMemoryUsage();
    
    const allHealthy = database.ok && memory.ok;
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: env.NODE_ENV,
      checks: {
        database,
        memory,
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    
    res.json({ 
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({ 
      ready: false,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/live', (req, res) => {
  res.json({ 
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
