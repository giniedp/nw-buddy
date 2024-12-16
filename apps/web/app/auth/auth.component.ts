import { Component, inject } from '@angular/core'
import { SupabaseService } from '../data/supabase'
import { TooltipModule } from '~/ui/tooltip'
import { AppMenuComponent } from '~/app-menu.component'
import { CdkMenuModule } from '@angular/cdk/menu'

@Component({
  standalone: true,
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  // styleUrls: ["./auth.component.scss"],
  imports: [TooltipModule, CdkMenuModule],
})
export class AuthComponent {
  protected supabase = inject(SupabaseService)

  async signIn(): Promise<void> {
    await this.supabase.signIn()
  }
  async signOut() {
    await this.supabase.signOut()
  }
}
