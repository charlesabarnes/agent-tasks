import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';

@Component({
  selector: 'spartan-drizzle-home',
  
  imports: [AnalogWelcomeComponent],
  template: `
     <spartan-drizzle-analog-welcome/>
  `,
})
export default class HomeComponent {
}
