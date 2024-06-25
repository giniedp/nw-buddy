import { worker } from 'workerpool'
import { WORKER_TASKS } from './tasks'

worker(WORKER_TASKS)

