import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],         // only needs the router
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {}

