
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import path from 'path';
import NodeCache from 'node-cache';

interface dbWorkerConfig {
  workerScriptPath: string;
  dbConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export class dbWorkerComponent extends EventEmitter {
  private worker: Worker | null = null;
  private internalData: any = null;
  private internalCache: NodeCache;

  constructor(private config: dbWorkerConfig) {
    super();
    this.internalCache = new NodeCache();
    this.startWorker();
    
  }

  private startWorker() {
    const workerPath = path.resolve(__dirname, this.config.workerScriptPath);
    this.worker = new Worker(workerPath, {
      workerData: this.config.dbConfig
    });

    this.worker.on('message', (data) => {
      this.internalData = data;
      this.emit('dataUpdated', data);
    });

    this.worker.on('message', (message) => {
      if (message.type === 'cacheUpdate') {
        this.internalCache.set(message.key, message.data);
      }
    });
    
    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
      this.emit('error', error);
      this.restartWorker();
    });

    this.worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        this.restartWorker();
      }
    });
    this.worker.postMessage({ type: 'initialFetch' });
  }

  private restartWorker() {
    setTimeout(() => {
      console.log('Restarting worker...');
      this.startWorker();
    }, 1000);
  }

  // public getData(): any {
  //   return this.internalData;
  // }
  public getData(key: string): any {
    return this.internalCache.get(key);
  }


  public terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
