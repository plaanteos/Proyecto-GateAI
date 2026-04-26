const cluster = require('cluster');
const os = require('os');
const path = require('path');
require('dotenv').config({ path: '.env.prod' });

if (cluster.isMaster || cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  
  console.log(`🚀 [PRODUCCIÓN] Iniciando UnionTech Security System`);
  console.log(`📊 CPUs disponibles: ${numCPUs}`);
  console.log(`🌐 Puerto: ${process.env.PORT || 3000}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📝 Logs: ${process.env.LOG_FILE_PATH || './logs/'}`);
  
  // Crear workers según los CPUs
  const workersToCreate = Math.min(numCPUs, 4); // Máximo 4 workers
  
  for (let i = 0; i < workersToCreate; i++) {
    const worker = cluster.fork();
    console.log(`👷 Worker ${worker.process.pid} iniciado`);
  }
  
  // Manejar workers que mueren
  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} terminó (${signal || code})`);
    console.log(`🔄 Reiniciando worker...`);
    
    const newWorker = cluster.fork();
    console.log(`✅ Nuevo worker ${newWorker.process.pid} iniciado`);
  });
  
  // Manejar señales del sistema
  process.on('SIGTERM', () => {
    console.log('📱 SIGTERM recibido. Cerrando gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    
    setTimeout(() => {
      console.log('🛑 Forzando cierre del cluster master');
      process.exit(0);
    }, 10000);
  });
  
  process.on('SIGINT', () => {
    console.log('⏹️ SIGINT recibido. Cerrando gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    
    setTimeout(() => {
      console.log('🛑 Forzando cierre del cluster master');
      process.exit(0);
    }, 5000);
  });
  
  // Estadísticas cada 30 segundos
  setInterval(() => {
    const workersCount = Object.keys(cluster.workers).length;
    const memUsage = process.memoryUsage();
    
    console.log(`📊 [STATS] Workers activos: ${workersCount}, RAM: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }, 30000);
  
} else {
  // Proceso worker - ejecutar el servidor principal
  console.log(`🔧 Worker ${process.pid} cargando servidor principal...`);
  
  // Manejar errores no capturados
  process.on('uncaughtException', (error) => {
    console.error(`💥 [Worker ${process.pid}] Error no capturado:`, error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error(`💥 [Worker ${process.pid}] Promise rechazada:`, reason);
    process.exit(1);
  });
  
  // Cargar el servidor principal
  require('./main-server.js');
}
