import { Routes } from '@angular/router';
import { Round2Component } from './round-2/round-2.component';
import { Round1Component } from './round-1/round-1.component';

export const routes: Routes = [
    { path: '', component: Round1Component, pathMatch:"full" }, // or to some welcome component
    { path: 'round-2', component: Round2Component },
];
