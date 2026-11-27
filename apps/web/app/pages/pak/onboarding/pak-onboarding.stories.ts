import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import type { DesktopGameFolder, DesktopNwbtState } from '~/desktop'
import { AppTestingModule } from '~/test'
import { PakOnboardingDesktopComponent } from './pak-onboarding-desktop.component'
import { PakOnboardingWebComponent } from './pak-onboarding-web.component'
import { PakOnboardingComponent } from './pak-onboarding.component'

const ENV_FILE = 'C:\\Games\\nw-buddy\\.env'
const GAME_DIR = 'S:\\Steam\\steamapps\\common\\New World'

function desktopState(problem: DesktopGameFolder['problem'], error = ''): DesktopNwbtState {
  return {
    url: '',
    error,
    folder: {
      envFile: ENV_FILE,
      dir: problem === 'unset' ? '' : GAME_DIR,
      problem,
      error: problem === 'env' ? `open ${ENV_FILE}: Access is denied.` : '',
    },
  }
}

export default {
  title: 'Pages / nwb-pak-onboarding',
  component: PakOnboardingComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [PakOnboardingWebComponent, PakOnboardingDesktopComponent],
    }),
  ],
  args: {
    desktop: false,
    checking: false,
    error: null,
    permission: null,
    state: null,
    foundGameDir: null,
    searching: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <nwb-pak-onboarding class="h-screen" [checking]="checking" [error]="error">
        @if (desktop) {
          <nwb-pak-onboarding-desktop
            [state]="state"
            [checking]="checking"
            [foundGameDir]="foundGameDir"
            [searching]="searching"
          />
        } @else {
          <nwb-pak-onboarding-web nwbtUrl="http://localhost:8000" [checking]="checking" [permission]="permission" />
        }
      </nwb-pak-onboarding>
    `,
  }),
} satisfies Meta

type Story = StoryObj

export const WebConnecting: Story = { args: { checking: true } }
export const WebWaiting: Story = {}
export const WebPermissionPrompt: Story = { args: { permission: 'prompt' } }
export const WebPermissionDenied: Story = { args: { permission: 'denied' } }
export const WebPermissionGranted: Story = { args: { permission: 'granted' } }
export const WebLoadFailed: Story = {
  args: { permission: 'granted', error: 'Failed to fetch dynamically imported module: /viewer-lib/index.js' },
}

export const DesktopLoading: Story = { args: { desktop: true } }
export const DesktopStarting: Story = { args: { desktop: true, state: desktopState('') } }
export const DesktopFolderUnset: Story = { args: { desktop: true, state: desktopState('unset') } }
export const DesktopFolderUnreachable: Story = { args: { desktop: true, state: desktopState('unreachable') } }
export const DesktopEnvUnreadable: Story = { args: { desktop: true, state: desktopState('env') } }
export const DesktopSearching: Story = { args: { desktop: true, state: desktopState('unset'), searching: true } }
export const DesktopFound: Story = { args: { desktop: true, state: desktopState('unset'), foundGameDir: GAME_DIR } }
export const DesktopNotFound: Story = { args: { desktop: true, state: desktopState('unset'), foundGameDir: '' } }
export const DesktopNwbtError: Story = {
  args: { desktop: true, state: desktopState('', 'nwbt exited: exit status 1') },
}
