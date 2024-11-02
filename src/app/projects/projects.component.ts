import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Project {
  id: number;
  name: string;
  description: string;
  image: string;
  languages: string[];
  skills: string[];
  link?: string;
  awards?: string[];
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.http.get<Project[]>('assets/projects.json').subscribe(data => {
      this.projects = data;
    });
  }

  navigateToProjectDetail(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }
}
