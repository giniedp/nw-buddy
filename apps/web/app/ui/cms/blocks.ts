import { CommonModule } from '@angular/common'
import { Component, Directive, HostBinding, Input, OnChanges, Type, ViewContainerRef, inject } from '@angular/core'
import { fromMarkdown } from 'mdast-util-from-markdown'

type Content = ReturnType<typeof fromMarkdown>
type ContentChildren = Content['children']
export type ContentChild = ContentChildren[0]

@Directive({
  standalone: true,
  selector: '[nwbRichTextContent]',
})
export class RichTextOutletDirective implements OnChanges {
  @Input('nwbRichTextContent')
  public content: ContentChild[]

  private vcRef = inject(ViewContainerRef)

  public ngOnChanges() {
    this.vcRef.clear()

    let children = this.content
    if (!children?.length) {
      return
    }

    for (const node of children) {
      const spec = getContentComponent(node)
      if (!spec) {
        continue
      }
      const instance = this.vcRef.createComponent(spec.type, {
        injector: this.vcRef.injector,
      })
      for (const [prop, value] of Object.entries(spec.props)) {
        instance.setInput(prop, value)
      }
    }
  }
}

interface ComponentSpec<T> {
  type: Type<T>
  props: Partial<T>
}

function spec<T>(type: Type<T>, props: Partial<T>): ComponentSpec<T> {
  return { type, props }
}

function getContentComponent(child: ContentChild): ComponentSpec<any> {
  switch (child.type) {
    case 'heading':
      switch (child.depth) {
        case 1:
          return spec(H1, { children: child.children })
        case 2:
          return spec(H2, { children: child.children })
        case 3:
          return spec(H3, { children: child.children })
        case 4:
          return spec(H4, { children: child.children })
        case 5:
          return spec(H5, { children: child.children })
        case 6:
          return spec(H6, { children: child.children })
        default:
          return null
      }
    case 'paragraph':
      return spec(Phrasing, { children: child.children })
    case 'text':
      return spec(InlineText, { text: child.value })
    case 'link':
      return spec(Link, { children: child.children, url: child.url, title: child.title })
    case 'emphasis':
      return spec(Inline, { children: child.children, italic: true })
    case 'strong':
      return spec(Inline, { children: child.children, bold: true })
    case 'delete':
      return spec(Inline, { children: child.children, strikethrough: true })
    case 'inlineCode':
      return spec(InlineCode, { text: child.value })
    case 'list':
      return spec(child.ordered ? Ol : Ul, { children: child.children })
    case 'listItem':
      return spec(Li, { children: child.children })
    case 'blockquote':
      return spec(Blockquote, { children: child.children })
    case 'code':
      return spec(CodeBlock, { lang: child.lang, value: child.value })
    case 'image':
      return spec(Image, { url: child.url, alt: child.alt, caption: child.title })
    case 'thematicBreak':
      return spec(Hr, {})
    case 'break':
      return spec(Br, {})
    case 'html':
      return spec(HtmlBlock, { value: child.value })
    case 'table':
      return spec(Table, { children: child.children })
    case 'tableRow':
      return spec(Tr, { children: child.children })
    case 'tableCell':
      return spec(Td, { children: child.children })
    default:
      console.warn(`Unknown node type: ${child.type}`)
      return null
  }
}

@Directive({})
export class BaseComponent {
  @Input()
  public children: ContentChild[]
}

@Component({
  standalone: true,
  selector: 'h1',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class H1 extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'h2',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class H2 extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'h3',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class H3 extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'h4',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class H4 extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'h5',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class H5 extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'h6',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class H6 extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'p',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Phrasing extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'a',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Link extends BaseComponent {
  @HostBinding('attr.href')
  public url: string

  @HostBinding('attr.title')
  public title: string
}

@Component({
  standalone: true,
  selector: 'span',
  template: ` {{ text }} `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class InlineText extends BaseComponent {
  @Input()
  public text: string

  @Input()
  @HostBinding('class.bold')
  public bold: boolean

  @Input()
  @HostBinding('class.italic')
  public italic: boolean

  @Input()
  @HostBinding('class.undeline')
  public underline: boolean

  @Input()
  @HostBinding('class.striketrhough')
  public strikethrough: boolean
}

@Component({
  standalone: true,
  selector: 'code',
  template: ` {{ text }}`,
  imports: [CommonModule, RichTextOutletDirective],
})
export class InlineCode extends BaseComponent {
  @Input()
  public text: string
}

@Component({
  standalone: true,
  selector: 'span',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Inline extends BaseComponent {
  @Input()
  public text: string

  @Input()
  @HostBinding('class.bold')
  public bold: boolean

  @Input()
  @HostBinding('class.italic')
  public italic: boolean

  @Input()
  @HostBinding('class.undeline')
  public underline: boolean

  @Input()
  @HostBinding('class.striketrhough')
  public strikethrough: boolean
}

@Component({
  standalone: true,
  selector: 'div',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Block extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'code',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Code extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'ul',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Ul extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'ol',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Ol extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'li',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Li extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'lic',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class LicComponent extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'quote',
  template: ` <ng-container [nwbRichTextContent]="children"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Blockquote extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'pre',
  template: `<code>{{ value }}</code>`,
  imports: [CommonModule, RichTextOutletDirective],
})
export class CodeBlock extends BaseComponent {
  @Input()
  public lang: string

  @Input()
  public value: string
}

@Component({
  standalone: true,
  selector: 'img',
  template: ``,
  imports: [CommonModule, RichTextOutletDirective],
})
export class Image extends BaseComponent {
  @HostBinding('attr.src')
  @Input()
  public url: string

  @HostBinding('attr.alt')
  @Input()
  public alt: string

  @HostBinding('attr.caption')
  @Input()
  public caption: string
}

@Component({
  standalone: true,
  selector: 'hr',
  template: ``,
})
export class Hr {}

@Component({
  standalone: true,
  selector: 'br',
  template: ``,
})
export class Br {}

@Component({
  standalone: true,
  selector: 'div',
  template: ``,
})
export class HtmlBlock {
  @HostBinding('attr.innerHtml')
  @Input()
  public value: string
}

@Component({
  standalone: true,
  selector: 'table',
  template: ``,
})
export class Table extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'tr',
  template: ``,
})
export class Tr extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'td',
  template: ``,
})
export class Td extends BaseComponent {}

@Component({
  standalone: true,
  selector: 'span',
  template: ``,
})
export class HtmlInline {
  @HostBinding('attr.innerHtml')
  public value: string
}
