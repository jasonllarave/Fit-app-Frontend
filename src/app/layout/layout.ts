import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';


@Component({
  selector: 'app-layout',
  standalone:true,
  imports: [CommonModule, RouterOutlet, Navbar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {}
