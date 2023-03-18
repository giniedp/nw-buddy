import { worker } from 'workerpool'
import { WORKER_TASKS } from './worker.tasks'

worker(WORKER_TASKS)
