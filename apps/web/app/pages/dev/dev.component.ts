import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  standalone: true,
  templateUrl: './dev.component.html',
  imports: [CommonModule, RouterModule],
  host: {
    class: 'layout-row gap-4',
  },
})
export class DevComponent {

}
