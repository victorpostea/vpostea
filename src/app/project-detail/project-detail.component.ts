import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Project {
  id: number;
  name: string;
  description: string;
  image: string;
  languages: string[];
  skills: string[];
  githubLink?: string;
  linkedinLink?: string;
  liveProjectLink?: string;
  awards?: string[];
}

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | undefined;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.http.get<Project[]>('assets/projects.json').subscribe(data => {
      this.project = data.find(project => project.id === projectId);
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}
