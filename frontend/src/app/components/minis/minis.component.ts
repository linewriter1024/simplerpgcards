import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MiniListComponent } from "./mini-list/mini-list.component";
import { MiniSheetEditorComponent } from "./mini-sheet-editor/mini-sheet-editor.component";

@Component({
  selector: "app-minis",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MiniListComponent,
    MiniSheetEditorComponent,
  ],
  templateUrl: "./minis.component.html",
  styleUrl: "./minis.component.scss",
})
export class MinisComponent implements OnInit {
  currentMode: "library" | "sheets" = "library";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
  ) {}

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes("/sheets")) {
      this.currentMode = "sheets";
    } else {
      this.currentMode = "library";
    }
    this.updatePageTitle();
  }

  switchMode(mode: "library" | "sheets"): void {
    this.currentMode = mode;
    const baseUrl = "/minis";
    const targetUrl = mode === "library" ? baseUrl : `${baseUrl}/${mode}`;
    this.router.navigate([targetUrl]);
    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    let title = "Printable Minis";
    if (this.currentMode === "sheets") {
      title = "Mini Print Sheets";
    } else {
      title = "Mini Library";
    }
    this.titleService.setTitle(title);
  }
}
