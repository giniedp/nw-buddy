import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, output } from '@angular/core'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { ExpressionNode } from '@nw-data/common'
import { uniqBy } from 'lodash'
import { DamageIndicatorService } from '../damage-indicator.service'
@Component({
  selector: 'nwb-damage-math',
  template: `
    <table class="table">
      @for (variable of variables(); track variable.name) {
        <tbody
          class="hover:bg-neutral border-t-2 border-base-200"
          (mouseenter)="indicator.value.set(variable.name)"
          [class.bg-neutral]="indicator.value() === variable.name"
        >
          @for (step of steps(variable); track $index) {
            <tr class="border-0">
              <td>
                @if ($index === 0) {
                  <math>
                    <mi>{{ variable.name }}</mi>
                  </math>
                }
              </td>
              <td>
                <math>
                  <mo>=</mo>
                </math>
              </td>
              <td>
                <math [innerHTML]="step"></math>
              </td>
            </tr>
          }
        </tbody>
      }
    </table>
  `,
  imports: [CommonModule],
  host: {
    class: 'block max-w-full overflow-auto',
  },
  styles: `
    :host ::ng-deep math {
      font-size: larger;
    }
  `,
})
export class DamageMathComponent {
  private sanitizer = inject(DomSanitizer)
  public node = input<ExpressionNode>()
  public indicator = inject(DamageIndicatorService)

  protected variables = computed(() => {
    return uniqBy(extractVariables(this.node()).reverse(), (it) => it.name).reverse()
  })

  protected steps(node: ExpressionNode) {
    const result: SafeHtml[] = []
    if (!node.operands.length) {
      const html = this.sanitizer.bypassSecurityTrustHtml(expression(node, 0, true))
      result.push(html)
    } else {
      let count = countSteps(node.operands[0])
      while (count > 0) {
        const html = this.sanitizer.bypassSecurityTrustHtml(expression(node.operands[0], count, true))
        result.push(html)
        count--
      }
    }
    return result
  }
}

function extractVariables(node: ExpressionNode, out: ExpressionNode[] = []) {
  if (!node) {
    return out
  }
  if (isVariable(node)) {
    out.push(node)
  }
  for (const child of node.operands) {
    extractVariables(child, out)
  }
  return out
}

function countNodes(node: ExpressionNode) {
  let value = 1
  if (!node) {
    return value
  }
  for (const child of node.operands) {
    value += countNodes(child)
  }
  return value
}

function isVariable(node: ExpressionNode): boolean {
  return node.operator === 'variable' || node.operator === 'value'
}

function tag(name: string, ...content: string[]) {
  return `<${name}>${content.join(' ')}</${name}>`
}
function mtable(...content: string[]) {
  return `<mtable rowspacing="4pt">${content.join(' ')}</mtable>`
}
function mtr(...content: string[]) {
  return tag('mtr', ...content)
}
function mtdl(...content: string[]) {
  return `<mtd style="text-align: left">${content.join(' ')}</mtd>`
}
function mo(content: string) {
  return tag('mo', content)
}
function mn(content: string) {
  return tag('mn', content)
}
function mi(content: string) {
  return tag('mi', content)
}
function mrow(...content: string[]) {
  return tag('mrow', ...content)
}
function msup(base: string, exp: string) {
  return tag('msup', base, exp)
}
function mfrac(upper: string, lower: string) {
  return tag('mfrac', upper, lower)
}

function countSteps(node: ExpressionNode): number {
  if (node.operator === 'variable' || node.operator === 'value') {
    return 2
  }
  return 1 + Math.max(0, ...node.operands.map(countSteps))
}

function expression(node: ExpressionNode, solveDepth: number, isOutside: boolean = false) {
  const nodeCount = countNodes(node)
  const preferMultiline = (isOutside && nodeCount >= 10) || countNodes(node) >= 30

  if (solveDepth <= 1) {
    return mn(String(node.value))
  }

  switch (node.operator) {
    case 'variable': {
      return mi(node.name)
    }
    case 'value': {
      return mi(node.name)
    }
    case 'constant': {
      return mn(String(node.value))
    }
    case 'floor': {
      return mrow(
        mo('&#x230A;'),
        node.operands.map((it) => expression(it, solveDepth - 1)).join(mo(',')),
        mo('&#x230B;'),
      )
    }
    case 'pow': {
      return msup(expression(node.operands[0], solveDepth - 1), expression(node.operands[1], solveDepth - 1))
    }
    case 'min': {
      return mrow(mi('min'), mo('('), node.operands.map((it) => expression(it, solveDepth - 1)).join(mo(',')), mo(')'))
    }
    case 'max': {
      return mrow(mi('max'), mo('('), node.operands.map((it) => expression(it, solveDepth - 1)).join(mo(',')), mo(')'))
    }
    case 'sum': {
      const nodes = [mo('('), node.operands.map((it) => expression(it, solveDepth - 1)).join(mo('+')), mo(')')]
      if (isOutside) {
        nodes.shift()
        nodes.pop()
      }
      return mrow(...nodes)
    }
    case 'mul': {
      if (!preferMultiline) {
        return mrow(node.operands.map((it) => expression(it, solveDepth - 1)).join(mo('&times;')))
      }
      const nodes = [
        mo('('),
        mtable(
          ...node.operands.map((it, i) => {
            return mtr(
              mtdl(
                `<mspace height="1.2rem"/>`,
                mrow(i > 0 ? mo('&times;') : '<mspace width="1.2rem"/>', expression(it, solveDepth - 1)),
              ),
            )
          }),
        ),
        mo(')'),
      ]
      if (isOutside) {
        nodes.shift()
        nodes.pop()
      }
      return mrow(...nodes)
    }
    case 'div': {
      return mfrac(expression(node.operands[0], solveDepth - 1), expression(node.operands[1], solveDepth - 1))
    }
    case 'sub': {
      const nodes = [
        mo('('),
        expression(node.operands[0], solveDepth - 1),
        mo('-'),
        expression(node.operands[1], solveDepth - 1),
        mo(')'),
      ]
      if (isOutside) {
        nodes.shift()
        nodes.pop()
      }
      return mrow(...nodes)
    }
    case 'negate': {
      return mrow(mo('&#x2212;'), expression(node.operands[0], solveDepth - 1))
    }
    default: {
      throw new Error(`Unknown operator: ${node.operator} in node ${JSON.stringify(node)}`)
    }
  }
}
