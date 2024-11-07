/// <reference lib="webworker" />
import { expose } from 'comlink'
import { NwData } from './nw-data'

expose(NwData)
