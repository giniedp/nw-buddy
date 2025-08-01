import { CdkMenuModule } from '@angular/cdk/menu'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BackendService } from '~/data/backend'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  imports: [TooltipModule, CdkMenuModule, RouterLink  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hidden]': '!isEnabled()',
  },
})
export class AuthComponent {
  protected backend = inject(BackendService)

  protected isOnline = this.backend.isOnline
  protected isEnabled = this.backend.isEnabled
  protected isSignedIn = this.backend.isSignedIn
  protected userName = computed(() => this.backend.session()?.name)
  protected initials = computed(() => this.userName().substring(0, 2))

  async signIn() {
    await this.backend.signIn()
  }

  async signOut() {
    await this.backend.signOut()
  }
}
