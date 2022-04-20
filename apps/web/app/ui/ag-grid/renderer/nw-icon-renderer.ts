import { IAfterGuiAttachedParams, ICellEditorComp, ICellEditorParams } from "ag-grid-community";

export class MoodRenderer implements ICellEditorComp  {

  private el: HTMLElement
  public init(params: ICellEditorParams) {
    params.value
    this.el = document.createElement('span');
    if (params.value !== '' || params.value !== undefined) {
      const imgForMood =
        params.value === 'Happy'
          ? 'https://www.ag-grid.com/example-assets/smileys/happy.png'
          : 'https://www.ag-grid.com/example-assets/smileys/sad.png';
      this.el.innerHTML = `<img width="20px" src="${imgForMood}" />`;
    }
  }

  public getGui() {
    return this.el;
  }

  public getValue() {
    throw new Error("Method not implemented.");
  }
}
