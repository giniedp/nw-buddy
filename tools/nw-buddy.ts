import 'colors'
import { program } from 'commander'
program.name('nw-buddy')
import './commands'
program.parse(process.argv)
