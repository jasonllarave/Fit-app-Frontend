import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class LandingTopbar {}
