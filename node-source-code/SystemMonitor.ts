import os from 'os';

export interface SystemMetrics {
  timestamp: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    totalMemory: number;
    freeMemory: number;
  };
  cpu: {
    userCPUUsage: number;
    systemCPUUsage: number;
    totalCPUUsage: number;
  };
}

export class SystemMonitor {
  private lastCPUUsage = process.cpuUsage();
  private lastTime = process.hrtime();

  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = this.calculateCPUUsage();
    const now = new Date();
    const tmsp = this.formatTimestamp(now);

    return {
      timestamp:tmsp,
      memory: {
       rss: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
       heapTotal: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
       heapUsed: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
       external: Number((memoryUsage.external / 1024 / 1024).toFixed(2)),
       totalMemory: Number((os.totalmem() / 1024 / 1024).toFixed(2)),
       freeMemory: Number((os.freemem() / 1024 / 1024).toFixed(2))
      },
      cpu: cpuUsage
    };
  }
  private calculateCPUUsage() {
    const currentCPUUsage = process.cpuUsage();
    const currentTime = process.hrtime();
    
    const timeDiff = process.hrtime(this.lastTime)[0];
    
    const userCPUDiff = currentCPUUsage.user - this.lastCPUUsage.user;
    const systemCPUDiff = currentCPUUsage.system - this.lastCPUUsage.system;
    
    const userCPUUsage =   Number(((userCPUDiff / (timeDiff * 1000000)) * 100).toFixed(2));
    const systemCPUUsage = Number(((systemCPUDiff / (timeDiff * 1000000)) * 100).toFixed(2));

    this.lastCPUUsage = currentCPUUsage;
    this.lastTime = currentTime;

    return { 
      userCPUUsage, 
      systemCPUUsage,
      totalCPUUsage: userCPUUsage + systemCPUUsage
    };
  }
	private formatTimestamp(date: Date): string {
		return `${date.getFullYear()}/${
		 String(date.getMonth() + 1).padStart(2, '0')
	}/${
		 String(date.getDate()).padStart(2, '0')
	} ${
		 String(date.getHours()).padStart(2, '0')
	}:${
		 String(date.getMinutes()).padStart(2, '0')
	}:${
		 String(date.getSeconds()).padStart(2, '0')
	}`;
}
  startMonitoring(interval: number = 5000, callback?: (metrics: SystemMetrics) => void) {
    return setInterval(() => {
      const metrics = this.getSystemMetrics();
      if (callback) callback(metrics);
    }, interval);
  }
}