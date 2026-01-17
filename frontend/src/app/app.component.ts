import { Component } from "@angular/core";
import { RouterOutlet, Router } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "RPG Manager";

  constructor(private router: Router) {}

  isCardsActive(): boolean {
    return this.router.url.includes("/cards");
  }

  isStatblocksActive(): boolean {
    return this.router.url.includes("/statblocks");
  }

  isMinisActive(): boolean {
    return this.router.url.includes("/minis");
  }

  navigateToCards(): void {
    this.router.navigate(["/cards"]);
  }

  navigateToStatblocks(): void {
    this.router.navigate(["/statblocks"]);
  }

  navigateToMinis(): void {
    this.router.navigate(["/minis"]);
  }
}
