import 'colors'
import { program } from 'commander'
program.name('nw-buddy')
import './lib/commands'
program.parse(process.argv)
