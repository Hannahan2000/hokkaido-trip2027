import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
isSplash = true; // 控制是否為開場狀態

  ngOnInit() {
    // 停留 2.5 秒後，觸發變身成 Header 的收合動畫
    setTimeout(() => {
      this.isSplash = false;
    }, 2500);
  }
}
