import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IconsModule } from '../icons'
import { svgFilter, svgFilterSlash, svgLayerPlus, svgPlus, svgTrashCan } from '../icons/svg'
import { TooltipModule } from '../tooltip'
import { CONDITION_DEFAULT_OPERATOR, ExpressionTreeStore, GROUP_DEFAULT_OPERATOR } from './expression-tree-editor-store'
import { ExpressionNode, isCondition, isGroup } from './types'

@Component({
  selector: 'nwb-expression-tree-node',
  templateUrl: './expression-tree-node.component.html',
  styleUrls: ['./expression-tree-node.component.scss'],
  imports: [CommonModule, FormsModule, IconsModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpressionTreeNodeComponent implements OnChanges {
  private readonly store = inject(ExpressionTreeStore)

  protected iconDelete = svgTrashCan
  protected iconAdd = svgPlus
  protected iconAddGroup = svgLayerPlus
  protected iconFilter = svgFilter
  protected iconFilterSlash = svgFilterSlash

  @Input()
  public node: ExpressionNode

  @Input()
  public isRoot = false

  public get isGroup() {
    return this.node.type === 'group'
  }

  public get isCondition() {
    return this.node.type === 'condition'
  }

  public get isNegated() {
    return this.node.negate
  }
  public set isNegated(value: boolean) {
    this.store.setNegate(this.node, value)
  }
  public get isIgnored() {
    return this.node.ignore
  }
  public set isIgnored(value: boolean) {
    this.store.setIgnore(this.node, value)
  }

  public get operator() {
    if (isGroup(this.node)) {
      return this.node.operator || GROUP_DEFAULT_OPERATOR
    }
    return this.node.operator || CONDITION_DEFAULT_OPERATOR
  }

  public set operator(value: string) {
    this.store.setOperator(this.node, value)
  }

  public get field() {
    return isCondition(this.node) && this.node.field
  }
  public set field(value: string) {
    if (isCondition(this.node)) {
      this.store.setFieldId(this.node, value)
    }
  }

  public get value() {
    return isCondition(this.node) && this.node.value
  }
  public set value(value: string) {
    if (isCondition(this.node)) {
      this.store.setFieldValue(this.node, value)
    }
  }

  public get children() {
    return isGroup(this.node) ? this.node.children : null
  }

  public get operatorOptions() {
    return isGroup(this.node) ? this.store.groupOperators$() : this.store.fieldOperators$()
  }

  public get fieldOptions() {
    return isGroup(this.node) ? null : this.store.knowFields$()
  }

  public deleteClicked() {
    this.store.removeNode(this.node)
  }

  public addGroupClicked() {
    if (isGroup(this.node)) {
      this.store.addGroup(this.node)
    }
  }

  public addFieldClicked() {
    if (isGroup(this.node)) {
      this.store.addField(this.node)
    }
  }
  protected trackByIndex = (index: number) => index

  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }
}
