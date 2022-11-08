import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavToolbarModule } from "~/ui/nav-toolbar";

@Component({
  standalone: true,
  templateUrl: './dev.component.html',
  imports: [CommonModule, RouterModule, NavToolbarModule],
  host: {
    class: 'layout-col layout-gap',
  },
})
export class DevComponent {

}
